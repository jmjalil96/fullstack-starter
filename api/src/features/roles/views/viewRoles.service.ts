/**
 * viewRoles.service.ts
 * Service for viewing and listing roles with role-based authorization
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

import type { GetRolesResponse, RoleListItemResponse } from './viewRoles.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type (returned from getUserWithContext)
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Get all active roles
 *
 * Role-based authorization:
 * - BROKER_EMPLOYEES only: Can view all roles
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden (admin feature)
 *
 * @param userId - ID of user requesting roles
 * @returns List of active roles
 */
export async function getRoles(userId: string): Promise<GetRolesResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (BROKER_EMPLOYEES only)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized roles list access attempt')
    throw new ForbiddenError('No tienes permiso para ver roles')
  }

  // STEP 3: Fetch Active Roles
  const roles = await db.role.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
    },
  })

  // STEP 4: Transform Data to DTO
  const transformedRoles: RoleListItemResponse[] = roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
  }))

  // STEP 5: Log Activity
  logger.info(
    {
      userId,
      role: roleName,
      resultCount: transformedRoles.length,
    },
    'Roles retrieved'
  )

  // STEP 6: Return Response
  return {
    roles: transformedRoles,
  }
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
