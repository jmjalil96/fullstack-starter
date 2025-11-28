/**
 * deactivateUser.service.ts
 * Service for deactivating users (SUPER_ADMIN only)
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { DeactivateUserResponse } from './editUser.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** User context type (returned from getUserWithContext) */
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Deactivate a user and their linked entity
 *
 * Authorization:
 * - Only SUPER_ADMIN can deactivate users
 *
 * Business Logic:
 * - Sets linked entity (Employee/Agent/Affiliate) isActive = false
 * - Deletes all user sessions (force logout)
 * - Does NOT delete the user account
 *
 * @param userId - ID of user making the request
 * @param targetUserId - ID of user to deactivate
 * @returns Deactivation result
 */
export async function deactivateUser(
  userId: string,
  targetUserId: string
): Promise<DeactivateUserResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (SUPER_ADMIN only)
  const roleName = user.globalRole?.name

  if (roleName !== 'SUPER_ADMIN') {
    logger.warn({ userId, role: roleName }, 'Unauthorized user deactivation attempt')
    throw new ForbiddenError('Solo los super administradores pueden desactivar usuarios')
  }

  // STEP 3: Prevent Self-Deactivation
  if (userId === targetUserId) {
    throw new BadRequestError('No puedes desactivar tu propia cuenta')
  }

  // STEP 4: Find Target User with Linked Entities
  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      email: true,
      employee: { select: { id: true, isActive: true } },
      agent: { select: { id: true, isActive: true } },
      affiliate: { select: { id: true, isActive: true } },
    },
  })

  if (!targetUser) {
    throw new NotFoundError('Usuario no encontrado')
  }

  // STEP 5: Determine Entity Type and ID
  let entityType: string | null = null
  let entityId: string | null = null

  if (targetUser.employee) {
    entityType = 'EMPLOYEE'
    entityId = targetUser.employee.id
  } else if (targetUser.agent) {
    entityType = 'AGENT'
    entityId = targetUser.agent.id
  } else if (targetUser.affiliate) {
    entityType = 'AFFILIATE'
    entityId = targetUser.affiliate.id
  }

  // STEP 6: Transaction - Deactivate Entity and Delete Sessions
  let sessionsDeleted = 0

  await db.$transaction(async (tx) => {
    // Deactivate linked entity
    if (entityType === 'EMPLOYEE' && entityId) {
      await tx.employee.update({
        where: { id: entityId },
        data: { isActive: false },
      })
    } else if (entityType === 'AGENT' && entityId) {
      await tx.agent.update({
        where: { id: entityId },
        data: { isActive: false },
      })
    } else if (entityType === 'AFFILIATE' && entityId) {
      await tx.affiliate.update({
        where: { id: entityId },
        data: { isActive: false },
      })
    }

    // Delete all user sessions (force logout)
    const deleteResult = await tx.session.deleteMany({
      where: { userId: targetUserId },
    })
    sessionsDeleted = deleteResult.count
  })

  // STEP 7: Log Activity
  logger.info(
    {
      userId,
      targetUserId,
      targetEmail: targetUser.email,
      entityType,
      entityId,
      sessionsDeleted,
    },
    'User deactivated'
  )

  // STEP 8: Return Response
  return {
    id: targetUser.id,
    email: targetUser.email,
    deactivatedEntityType: entityType,
    deactivatedEntityId: entityId,
    sessionsDeleted,
    message: 'Usuario desactivado exitosamente',
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
