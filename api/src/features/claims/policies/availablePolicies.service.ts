/**
 * availablePolicies.service.ts
 * Service for retrieving policies available for a specific claim
 *
 * Returns policies where:
 * - Policy belongs to claim's client
 * - Claim's affiliate is covered under the policy (PolicyAffiliate join)
 * - Policy is active and not expired
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { ALL_AUTHORIZED_ROLES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { AvailablePolicyResponse } from './availablePolicies.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type (duplicated across services; consider extracting later)
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
  affiliate: { id: string; clientId: string } | null
  clientAccess: { clientId: string }[]
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Get policies available for assignment to a claim
 *
 * Authorization:
 * - Inherits claim access control (if you can view claim, you can see policy options)
 * - AFFILIATE: Can only access policies for their own claims
 * - CLIENT_ADMIN: Can only access policies for accessible clients' claims
 * - BROKER employees: Can access any claim's policies
 *
 * Filtering:
 * - Policies belonging to claim's client
 * - Affiliate must be covered under policy (PolicyAffiliate join)
 * - Active policies only (isActive = true, status = ACTIVE)
 * - Not expired (endDate >= now)
 *
 * @param userId - ID of user requesting policies
 * @param claimId - ID of claim to get policies for
 * @returns Array of available policies for dropdown
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role not allowed
 * @throws {NotFoundError} If claim not found or user has no access
 */
export async function getAvailablePolicies(
  userId: string,
  claimId: string
): Promise<AvailablePolicyResponse[]> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  // Use constants to prevent role list duplication
  const roleName = user.globalRole?.name

  if (!roleName || !ALL_AUTHORIZED_ROLES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized available policies access attempt')
    throw new ForbiddenError('No tienes permiso para ver pólizas')
  }

  // STEP 3: Load Claim
  // Only need clientId and affiliateId for policy query
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      clientId: true,
      affiliateId: true,
    },
  })

  if (!claim) {
    logger.warn({ userId, claimId }, 'Claim not found for available policies')
    throw new NotFoundError('Reclamo no encontrado')
  }

  // STEP 4: Resource-Level Access Control (Same as getClaimById)
  // If user can't view the claim, they can't see its policy options
  const isAffiliate = roleName === 'AFFILIATE'
  const isClientAdmin = roleName === 'CLIENT_ADMIN'

  if (isAffiliate) {
    if (claim.affiliateId !== user.affiliate?.id) {
      logger.warn(
        { userId, claimId, claimAffiliateId: claim.affiliateId, userAffiliateId: user.affiliate?.id },
        'AFFILIATE attempted to access policies for another user\'s claim'
      )
      throw new NotFoundError('Reclamo no encontrado')
    }
  } else if (isClientAdmin) {
    const hasAccess = user.clientAccess.some((uc) => uc.clientId === claim.clientId)
    if (!hasAccess) {
      logger.warn(
        { userId, claimId, claimClientId: claim.clientId, accessibleClients: user.clientAccess.map((c) => c.clientId) },
        'CLIENT_ADMIN attempted to access policies for unauthorized client claim'
      )
      throw new NotFoundError('Reclamo no encontrado')
    }
  }
  // BROKER employees have access to any claim - no additional check needed

  // STEP 5: Query Available Policies
  // Policies must:
  // 1. Belong to claim's client
  // 2. Cover the claim's affiliate (via PolicyAffiliate join)
  // 3. Be active and not expired
  const policies = await db.policy.findMany({
    where: {
      clientId: claim.clientId,
      isActive: true,
      status: 'ACTIVE',
      endDate: {
        gte: new Date(), // Not expired
      },
      affiliates: {
        some: {
          affiliateId: claim.affiliateId,
        },
      },
    },
    select: {
      id: true,
      policyNumber: true,
      type: true,
      insurer: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      policyNumber: 'asc',
    },
  })

  // STEP 6: Transform to DTO and Return
  const response: AvailablePolicyResponse[] = policies.map((policy) => ({
    id: policy.id,
    policyNumber: policy.policyNumber,
    type: policy.type,
    insurerName: policy.insurer.name,
  }))

  logger.info(
    { userId, claimId, count: response.length },
    'Retrieved available policies for claim'
  )

  return response
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with role, affiliate, and client access context for authorization
 *
 * @param userId - User ID to load
 * @returns UserContext or null if not found
 */
async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      globalRole: {
        select: { name: true },
      },
      affiliate: {
        select: { id: true, clientId: true },
      },
      clientAccess: {
        where: { isActive: true },
        select: { clientId: true },
      },
    },
  })
}
