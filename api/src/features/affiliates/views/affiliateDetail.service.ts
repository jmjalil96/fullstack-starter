/**
 * affiliateDetail.service.ts
 * Service for fetching a single affiliate detail with role-based authorization
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

import type { AffiliateDetailResponse } from './affiliateDetail.dto.js'

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
 * Get complete affiliate detail by ID with role-based authorization
 *
 * Role-based access:
 * - SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE: Can view any affiliate
 * - CLIENT_ADMIN: Can view affiliates where affiliate.clientId is in their accessible clients
 * - AFFILIATE: Explicitly forbidden (403 error)
 *
 * Security:
 * - Returns 404 if affiliate does not exist OR user lacks access (avoid leaking existence)
 * - AFFILIATE role is blocked to prevent affiliates from viewing other affiliates
 *
 * @param userId - ID of the requesting user
 * @param affiliateId - ID of the affiliate to fetch (CUID)
 * @returns AffiliateDetailResponse (flat DTO)
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role is not permitted or is AFFILIATE
 * @throws {NotFoundError} If affiliate not found or user has no access
 */
export async function getAffiliateById(
  userId: string,
  affiliateId: string
): Promise<AffiliateDetailResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !ALL_AUTHORIZED_ROLES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized affiliate detail access attempt')
    throw new ForbiddenError('No tienes permiso para ver afiliados')
  }

  // Explicitly forbid AFFILIATE role from viewing affiliate details
  if (roleName === 'AFFILIATE') {
    logger.warn(
      { userId, role: roleName, affiliateId },
      'AFFILIATE role attempted to access affiliate detail view'
    )
    throw new ForbiddenError('No tienes permiso para ver afiliados')
  }

  // STEP 3: Query Affiliate with All Relations
  const affiliate = await db.affiliate.findUnique({
    where: { id: affiliateId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      documentType: true,
      documentNumber: true,
      affiliateType: true,
      coverageType: true,
      userId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      clientId: true,
      primaryAffiliateId: true,
      client: {
        select: { name: true },
      },
      primaryAffiliate: {
        select: { firstName: true, lastName: true },
      },
    },
  })

  // STEP 4: Validate Affiliate Exists
  if (!affiliate) {
    logger.warn({ userId, affiliateId }, 'Affiliate not found')
    throw new NotFoundError('Afiliado no encontrado')
  }

  // STEP 5: Role-Based Access Validation
  const isClientAdmin = roleName === 'CLIENT_ADMIN'

  if (isClientAdmin) {
    // CLIENT_ADMIN can only view affiliates from their accessible clients
    const hasAccess = user.clientAccess.some((uc) => uc.clientId === affiliate.clientId)
    if (!hasAccess) {
      logger.warn(
        { userId, affiliateId, affiliateClientId: affiliate.clientId, accessibleClients: user.clientAccess.map((c) => c.clientId) },
        'CLIENT_ADMIN attempted unauthorized affiliate access'
      )
      throw new NotFoundError('Afiliado no encontrado')
    }
  }
  // BROKER EMPLOYEES have access to any affiliate - no additional checks needed

  // STEP 6: Transform to Flat DTO Structure
  const response: AffiliateDetailResponse = {
    id: affiliate.id,
    firstName: affiliate.firstName,
    lastName: affiliate.lastName,
    email: affiliate.email,
    phone: affiliate.phone,
    dateOfBirth: affiliate.dateOfBirth?.toISOString().split('T')[0] ?? null,
    documentType: affiliate.documentType,
    documentNumber: affiliate.documentNumber,
    affiliateType: affiliate.affiliateType as 'OWNER' | 'DEPENDENT',
    coverageType: affiliate.coverageType as 'T' | 'TPLUS1' | 'TPLUSF' | null,
    hasUserAccount: affiliate.userId !== null,
    isActive: affiliate.isActive,
    createdAt: affiliate.createdAt.toISOString(),
    updatedAt: affiliate.updatedAt.toISOString(),
    clientId: affiliate.clientId,
    clientName: affiliate.client.name,
    primaryAffiliateId: affiliate.primaryAffiliateId,
    primaryAffiliateFirstName: affiliate.primaryAffiliate?.firstName ?? null,
    primaryAffiliateLastName: affiliate.primaryAffiliate?.lastName ?? null,
  }

  // STEP 7: Log Successful Access
  logger.info(
    { userId, affiliateId, role: roleName },
    'Affiliate detail retrieved'
  )

  // STEP 8: Return Response
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
