/**
 * affiliates.service.ts
 * Service for fetching available affiliates for claim creation
 *
 * SECURITY: AFFILIATE users can only see themselves (not all affiliates in their client)
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { ALL_AUTHORIZED_ROLES } from '../../../shared/constants/roles.js'
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { AvailableAffiliateResponse } from './affiliates.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type for authorization
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
  affiliate: { id: string; clientId: string; firstName: string; lastName: string; coverageType: string | null } | null
  clientAccess: { clientId: string }[]
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Get available affiliates for a specific client
 *
 * Authorization by role:
 * - BROKER_EMPLOYEES: All OWNER affiliates for the client
 * - CLIENT_ADMIN: All OWNER affiliates for the client (if they have access)
 * - AFFILIATE: ONLY themselves (prevents seeing other customers)
 *
 * @param userId - ID of user requesting affiliates
 * @param clientId - Client to get affiliates for
 * @returns Array of owner affiliates user can select
 */
export async function getAvailableAffiliates(
  userId: string,
  clientId: string
): Promise<AvailableAffiliateResponse[]> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !ALL_AUTHORIZED_ROLES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized affiliate list access attempt')
    throw new ForbiddenError('No tienes permiso para ver afiliados')
  }

  // STEP 3: Determine Role Type
  const isClientAdmin = roleName === 'CLIENT_ADMIN'
  const isAffiliate = roleName === 'AFFILIATE'

  // STEP 4: Client Access Validation
  if (isAffiliate) {
    // AFFILIATE can only query their own client
    if (clientId !== user.affiliate?.clientId) {
      logger.warn({ userId, requestedClient: clientId, userClient: user.affiliate?.clientId }, 'AFFILIATE attempted to access different client affiliates')
      throw new ForbiddenError('No puedes ver afiliados de otro cliente')
    }

    // SECURITY FIX: AFFILIATE can only see themselves (not all affiliates in client)
    // Return only the user's own affiliate record
    logger.info({ userId, affiliateId: user.affiliate.id }, 'AFFILIATE accessed their own affiliate record only')

    return [{
      id: user.affiliate.id,
      firstName: user.affiliate.firstName,
      lastName: user.affiliate.lastName,
      coverageType: user.affiliate.coverageType,
    }]
  }

  if (isClientAdmin) {
    const hasClientAccess = user.clientAccess.some((uc) => uc.clientId === clientId)
    if (!hasClientAccess) {
      logger.warn({ userId, requestedClient: clientId, accessibleClients: user.clientAccess.map(c => c.clientId) }, 'CLIENT_ADMIN attempted to access unauthorized client affiliates')
      throw new ForbiddenError('No tienes acceso a este cliente')
    }
  }
  // Broker employees can access any client - no check needed

  // STEP 5: Validate Client Existence and Status
  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { id: true, isActive: true },
  })

  if (!client) {
    throw new NotFoundError('Cliente no encontrado')
  }

  if (!client.isActive) {
    throw new BadRequestError('Cliente inactivo')
  }

  // STEP 6: Query Owner Affiliates for Client (BROKER_EMPLOYEES and CLIENT_ADMIN only)
  const affiliates = await db.affiliate.findMany({
    where: {
      clientId,
      affiliateType: 'OWNER',
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      coverageType: true,
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })

  logger.info({ userId, clientId, count: affiliates.length, role: roleName }, 'Retrieved available affiliates for claims')

  return affiliates
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with role, affiliate, and client access context for authorization
 * Includes additional affiliate fields needed for AFFILIATE users' self-return
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
        select: {
          id: true,
          clientId: true,
          firstName: true,
          lastName: true,
          coverageType: true,
        },
      },
      clientAccess: {
        where: { isActive: true },
        select: { clientId: true },
      },
    },
  })
}
