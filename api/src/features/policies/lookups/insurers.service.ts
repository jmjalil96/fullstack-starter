/**
 * insurers.service.ts
 * Service for fetching available insurers for policy creation
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

import type { AvailableInsurerResponse } from './insurers.dto.js'

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
 * Get available insurers for policy creation
 *
 * @param userId - ID of user requesting available insurers
 * @returns Array of active insurers
 */
export async function getAvailableInsurers(userId: string): Promise<AvailableInsurerResponse[]> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (broker employees only)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized insurers list access attempt')
    throw new ForbiddenError('No tienes permiso para ver aseguradoras')
  }

  // STEP 3: Query All Active Insurers
  const insurers = await db.insurer.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' },
  })

  // STEP 4: Log Activity
  logger.info({ userId, role: roleName, count: insurers.length }, 'Broker employee accessed insurers')

  // STEP 5: Return Insurers
  return insurers
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
