/**
 * addAffiliate.service.ts
 * Service for creating new affiliates and adding them to a policy
 *
 * Creates both the Affiliate record and PolicyAffiliate relationship
 * in a single atomic transaction. Only BROKER_EMPLOYEES can perform this action.
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

import type { AddAffiliateToPolicyResponse } from './addAffiliate.dto.js'
import type { AddAffiliateToPolicyInput } from './addAffiliate.schema.js'

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
 * Create a new affiliate and add them to a policy
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - No CLIENT_ADMIN access (they cannot create affiliates directly in policies)
 *
 * Validation:
 * - Policy must exist and be active
 * - Client ID must match policy's client
 * - For DEPENDENT: primaryAffiliateId must exist and be OWNER from same client
 * - Email required for OWNER, optional for DEPENDENT
 *
 * Process:
 * - Creates Affiliate record
 * - Creates PolicyAffiliate relationship
 * - Both in single transaction for atomicity
 *
 * @param userId - ID of the requesting user
 * @param policyId - ID of the policy to add affiliate to
 * @param data - Validated affiliate data from schema
 * @returns Created affiliate with policy relationship details
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role not allowed
 * @throws {NotFoundError} If policy not found
 * @throws {BadRequestError} If validation fails
 */
export async function addAffiliateToPolicy(
  userId: string,
  policyId: string,
  data: AddAffiliateToPolicyInput
): Promise<AddAffiliateToPolicyResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    logger.warn({ userId }, 'User not found for add affiliate request')
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name
  const isBrokerEmployee = roleName ? BROKER_EMPLOYEES.includes(roleName as never) : false

  if (!isBrokerEmployee) {
    logger.warn(
      { userId, role: roleName },
      'Unauthorized add affiliate to policy attempt'
    )
    throw new ForbiddenError('Solo empleados del broker pueden agregar afiliados a pólizas')
  }

  // STEP 3: Transaction for Atomic Operation
  const result = await db.$transaction(async (tx) => {
    // STEP 3A: Load and Validate Policy
    const policy = await tx.policy.findUnique({
      where: { id: policyId },
      select: {
        id: true,
        policyNumber: true,
        clientId: true,
        status: true,
        isActive: true,
        client: {
          select: { name: true },
        },
      },
    })

    if (!policy) {
      logger.warn({ userId, policyId }, 'Policy not found for add affiliate')
      throw new NotFoundError('Póliza no encontrada')
    }

    if (!policy.isActive) {
      logger.warn(
        { userId, policyId, status: policy.status },
        'Attempt to add affiliate to inactive policy'
      )
      throw new BadRequestError('La póliza no está activa')
    }

    // STEP 3B: Validate Client Match
    if (policy.clientId !== data.clientId) {
      logger.warn(
        {
          userId,
          policyId,
          policyClientId: policy.clientId,
          requestClientId: data.clientId,
        },
        'Client mismatch in add affiliate request'
      )
      throw new BadRequestError('El cliente debe coincidir con el cliente de la póliza')
    }

    // STEP 3C: Validate Primary Affiliate (for DEPENDENT)
    if (data.affiliateType === 'DEPENDENT') {
      if (!data.primaryAffiliateId) {
        throw new BadRequestError('Afiliado principal es requerido para dependientes')
      }

      const primaryAffiliate = await tx.affiliate.findUnique({
        where: { id: data.primaryAffiliateId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          affiliateType: true,
          isActive: true,
          clientId: true,
        },
      })

      if (!primaryAffiliate) {
        throw new NotFoundError('Afiliado principal no encontrado')
      }

      if (primaryAffiliate.affiliateType !== 'OWNER') {
        throw new BadRequestError('El afiliado principal debe ser un titular (OWNER)')
      }

      if (!primaryAffiliate.isActive) {
        throw new BadRequestError('Afiliado principal inactivo')
      }

      if (primaryAffiliate.clientId !== data.clientId) {
        throw new BadRequestError('El afiliado principal debe pertenecer al mismo cliente')
      }
    }

    // STEP 3D: Create Affiliate
    const newAffiliate = await tx.affiliate.create({
      data: {
        clientId: data.clientId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth || null,
        documentType: data.documentType || null,
        documentNumber: data.documentNumber || null,
        affiliateType: data.affiliateType,
        coverageType: data.coverageType || null,
        primaryAffiliateId: data.primaryAffiliateId || null,
        // isActive defaults to true
      },
      include: {
        client: {
          select: { name: true },
        },
        primaryAffiliate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        user: {
          select: { id: true },
        },
      },
    })

    // STEP 3E: Create PolicyAffiliate Relationship
    const policyAffiliate = await tx.policyAffiliate.create({
      data: {
        policyId: policyId,
        affiliateId: newAffiliate.id,
        addedAt: data.addedAt,
        // isActive defaults to true
        // removedAt defaults to null
      },
      select: {
        addedAt: true,
        removedAt: true,
        isActive: true,
      },
    })

    // STEP 3F: Log Success
    logger.info(
      {
        userId,
        policyId,
        affiliateId: newAffiliate.id,
        affiliateType: newAffiliate.affiliateType,
      },
      'Affiliate created and added to policy'
    )

    // STEP 3G: Format Response
    const response: AddAffiliateToPolicyResponse = {
      // Affiliate fields
      id: newAffiliate.id,
      firstName: newAffiliate.firstName,
      lastName: newAffiliate.lastName,
      email: newAffiliate.email,
      phone: newAffiliate.phone,
      dateOfBirth: newAffiliate.dateOfBirth?.toISOString().split('T')[0] ?? null,
      documentType: newAffiliate.documentType,
      documentNumber: newAffiliate.documentNumber,
      affiliateType: newAffiliate.affiliateType as 'OWNER' | 'DEPENDENT',
      coverageType: newAffiliate.coverageType as 'T' | 'TPLUS1' | 'TPLUSF' | null,
      clientId: newAffiliate.clientId,
      clientName: newAffiliate.client.name,
      primaryAffiliateId: newAffiliate.primaryAffiliateId,
      primaryAffiliateFirstName: newAffiliate.primaryAffiliate?.firstName ?? null,
      primaryAffiliateLastName: newAffiliate.primaryAffiliate?.lastName ?? null,
      hasUserAccount: !!newAffiliate.user,
      isActive: newAffiliate.isActive,
      createdAt: newAffiliate.createdAt.toISOString(),
      updatedAt: newAffiliate.updatedAt.toISOString(),

      // Policy relationship fields
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      addedAt: policyAffiliate.addedAt.toISOString(),
      removedAt: policyAffiliate.removedAt?.toISOString() ?? null,
      relationshipIsActive: policyAffiliate.isActive,
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