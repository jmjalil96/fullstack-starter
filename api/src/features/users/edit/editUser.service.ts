/**
 * editUser.service.ts
 * Service for editing user information (SUPER_ADMIN only)
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

import type { EditUserResponse } from './editUser.dto.js'
import type { EditUserInput } from './editUser.schema.js'

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
 * Edit a user's information
 *
 * Authorization:
 * - Only SUPER_ADMIN can edit users
 *
 * @param userId - ID of user making the request
 * @param targetUserId - ID of user to edit
 * @param data - Edit data (globalRoleId and/or name)
 * @returns Updated user information
 */
export async function editUser(
  userId: string,
  targetUserId: string,
  data: EditUserInput
): Promise<EditUserResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (SUPER_ADMIN only)
  const roleName = user.globalRole?.name

  if (roleName !== 'SUPER_ADMIN') {
    logger.warn({ userId, role: roleName }, 'Unauthorized user edit attempt')
    throw new ForbiddenError('Solo los super administradores pueden editar usuarios')
  }

  // STEP 3: Find Target User
  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true },
  })

  if (!targetUser) {
    throw new NotFoundError('Usuario no encontrado')
  }

  // STEP 4: Validate Role If Provided
  if (data.globalRoleId) {
    const role = await db.role.findUnique({
      where: { id: data.globalRoleId },
      select: { id: true, isActive: true },
    })

    if (!role) {
      throw new NotFoundError('Rol no encontrado')
    }

    if (!role.isActive) {
      throw new BadRequestError('El rol seleccionado está inactivo')
    }
  }

  // STEP 5: Update User
  const updatedUser = await db.user.update({
    where: { id: targetUserId },
    data: {
      ...(data.globalRoleId && { globalRoleId: data.globalRoleId }),
      ...(data.name && { name: data.name }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      globalRoleId: true,
      globalRole: {
        select: { name: true },
      },
    },
  })

  // STEP 6: Log Activity
  logger.info(
    {
      userId,
      targetUserId,
      changes: data,
    },
    'User edited'
  )

  // STEP 7: Return Response
  return {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    globalRoleId: updatedUser.globalRoleId,
    globalRoleName: updatedUser.globalRole?.name ?? null,
    message: 'Usuario actualizado exitosamente',
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
