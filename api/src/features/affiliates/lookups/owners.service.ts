/**
 * owners.service.ts
 * Service for fetching available owner affiliates for primary affiliate selection
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { AvailableOwnerResponse } from './owners.dto.js'
import type { GetAvailableOwnersQuery } from './owners.schema.js'

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
 * Get available owner affiliates for primary affiliate selection
 *
 * @param userId - ID of user requesting available owners
 * @param query - Query parameters (clientId required)
 * @returns Array of active owner affiliates from specified client
 */
export async function getAvailableOwners(
  userId: string,
  query: GetAvailableOwnersQuery
): Promise<AvailableOwnerResponse[]> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (broker employees only)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized owners list access attempt')
    throw new ForbiddenError('No tienes permiso para ver afiliados')
  }

  // STEP 3: Query Active Owner Affiliates
  const owners = await db.affiliate.findMany({
    where: {
      clientId: query.clientId,
      affiliateType: 'OWNER',
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      documentNumber: true,
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })

  // STEP 4: Log Activity
  logger.info(
    { userId, role: roleName, clientId: query.clientId, count: owners.length },
    'Broker employee accessed owners for affiliate creation'
  )

  // STEP 5: Return Owners
  return owners
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with role context
 *
 * @param userId - User ID to load
 * @returns User with role data
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
