/**
 * removeAffiliate.service.ts
 * Service for removing affiliates from a policy
 *
 * Sets removedAt and isActive=false on PolicyAffiliate relationship.
 * For OWNER affiliates, cascades removal to all dependents on same policy.
 * Only BROKER_EMPLOYEES can perform this action.
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { RemoveAffiliateFromPolicyResponse, RemovedAffiliateInfo } from './removeAffiliate.dto.js'
import type { RemoveAffiliateFromPolicyInput } from './removeAffiliate.schema.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type (simplified for broker-only access)
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Remove an affiliate from a policy
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - No CLIENT_ADMIN access
 *
 * Validation:
 * - Policy must exist
 * - Affiliate must be currently active on the policy
 * - removedAt cannot be before addedAt
 *
 * Process:
 * - For OWNER: also removes all dependents on same policy with same removedAt
 * - Updates PolicyAffiliate: sets removedAt, isActive = false
 *
 * @param userId - ID of the requesting user
 * @param policyId - ID of the policy
 * @param affiliateId - ID of the affiliate to remove
 * @param data - Validated removal data from schema
 * @returns Confirmation with removed affiliate info and cascaded dependents
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role not allowed
 * @throws {NotFoundError} If PolicyAffiliate not found
 * @throws {BadRequestError} If validation fails
 */
export async function removeAffiliateFromPolicy(
  userId: string,
  policyId: string,
  affiliateId: string,
  data: RemoveAffiliateFromPolicyInput
): Promise<RemoveAffiliateFromPolicyResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    logger.warn({ userId }, 'User not found for remove affiliate request')
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name
  const isBrokerEmployee = roleName ? BROKER_EMPLOYEES.includes(roleName as never) : false

  if (!isBrokerEmployee) {
    logger.warn(
      { userId, role: roleName },
      'Unauthorized remove affiliate from policy attempt'
    )
    throw new ForbiddenError('Solo empleados del broker pueden remover afiliados de pólizas')
  }

  // STEP 3: Transaction for Atomic Operation
  const result = await db.$transaction(async (tx) => {
    // STEP 3A: Load and Validate PolicyAffiliate
    const policyAffiliate = await tx.policyAffiliate.findUnique({
      where: {
        policyId_affiliateId: { policyId, affiliateId },
      },
      select: {
        policyId: true,
        affiliateId: true,
        addedAt: true,
        isActive: true,
        policy: {
          select: {
            id: true,
            policyNumber: true,
          },
        },
        affiliate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            affiliateType: true,
            primaryAffiliateId: true,
          },
        },
      },
    })

    if (!policyAffiliate) {
      logger.warn({ userId, policyId, affiliateId }, 'PolicyAffiliate not found for removal')
      throw new NotFoundError('Afiliado no encontrado en esta póliza')
    }

    if (!policyAffiliate.isActive) {
      logger.warn(
        { userId, policyId, affiliateId },
        'Attempt to remove already inactive affiliate from policy'
      )
      throw new BadRequestError('El afiliado ya fue removido de esta póliza')
    }

    // STEP 3B: Validate removedAt >= addedAt
    if (data.removedAt < policyAffiliate.addedAt) {
      throw new BadRequestError('La fecha de baja no puede ser anterior a la fecha de incorporación')
    }

    // STEP 3C: Find dependents to cascade (if OWNER)
    let cascadedDependents: RemovedAffiliateInfo[] = []

    if (policyAffiliate.affiliate.affiliateType === 'OWNER') {
      // Find all dependents of this owner on the same policy
      const dependentsOnPolicy = await tx.policyAffiliate.findMany({
        where: {
          policyId,
          isActive: true,
          affiliate: {
            primaryAffiliateId: affiliateId,
          },
        },
        select: {
          affiliateId: true,
          addedAt: true,
          affiliate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              affiliateType: true,
            },
          },
        },
      })

      if (dependentsOnPolicy.length > 0) {
        // Update all dependents with same removedAt
        await tx.policyAffiliate.updateMany({
          where: {
            policyId,
            affiliateId: { in: dependentsOnPolicy.map((d) => d.affiliateId) },
          },
          data: {
            removedAt: data.removedAt,
            isActive: false,
          },
        })

        // Build cascade info for response
        cascadedDependents = dependentsOnPolicy.map((d) => ({
          affiliateId: d.affiliate.id,
          affiliateFirstName: d.affiliate.firstName,
          affiliateLastName: d.affiliate.lastName,
          affiliateType: d.affiliate.affiliateType as 'OWNER' | 'DEPENDENT',
          addedAt: d.addedAt.toISOString(),
          removedAt: data.removedAt.toISOString(),
        }))

        logger.info(
          { userId, policyId, affiliateId, cascadedCount: dependentsOnPolicy.length },
          'Cascaded removal of dependents'
        )
      }
    }

    // STEP 3D: Update PolicyAffiliate (the target affiliate)
    await tx.policyAffiliate.update({
      where: {
        policyId_affiliateId: { policyId, affiliateId },
      },
      data: {
        removedAt: data.removedAt,
        isActive: false,
      },
    })

    // STEP 3E: Log Success
    logger.info(
      {
        userId,
        policyId,
        affiliateId,
        affiliateType: policyAffiliate.affiliate.affiliateType,
        removedAt: data.removedAt,
        cascadedDependents: cascadedDependents.length,
      },
      'Affiliate removed from policy'
    )

    // STEP 3F: Format Response
    const response: RemoveAffiliateFromPolicyResponse = {
      policyId: policyAffiliate.policy.id,
      policyNumber: policyAffiliate.policy.policyNumber,
      removedAffiliate: {
        affiliateId: policyAffiliate.affiliate.id,
        affiliateFirstName: policyAffiliate.affiliate.firstName,
        affiliateLastName: policyAffiliate.affiliate.lastName,
        affiliateType: policyAffiliate.affiliate.affiliateType as 'OWNER' | 'DEPENDENT',
        addedAt: policyAffiliate.addedAt.toISOString(),
        removedAt: data.removedAt.toISOString(),
      },
      cascadedDependents,
    }

    return response
  })

  return result
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with role context
 * @param userId - User ID to load
 * @returns User with role or null if not found
 */
async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      globalRole: {
        select: { name: true },
      },
    },
  })
}
