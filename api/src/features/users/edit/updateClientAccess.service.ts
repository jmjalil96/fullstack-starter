/**
 * updateClientAccess.service.ts
 * Service for updating user's client access (SUPER_ADMIN only)
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

import type { UpdateClientAccessResponse } from './editUser.dto.js'
import type { UpdateClientAccessInput } from './editUser.schema.js'

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
 * Update a user's client access
 *
 * Authorization:
 * - Only SUPER_ADMIN can update client access
 *
 * Business Logic:
 * - Only affiliates can have client access (for CLIENT_ADMIN role)
 * - Replaces all existing client access with new list
 * - Empty array removes all access
 *
 * @param userId - ID of user making the request
 * @param targetUserId - ID of user to update
 * @param data - Client IDs to grant access to
 * @returns Updated client access information
 */
export async function updateClientAccess(
  userId: string,
  targetUserId: string,
  data: UpdateClientAccessInput
): Promise<UpdateClientAccessResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (SUPER_ADMIN only)
  const roleName = user.globalRole?.name

  if (roleName !== 'SUPER_ADMIN') {
    logger.warn({ userId, role: roleName }, 'Unauthorized client access update attempt')
    throw new ForbiddenError('Solo los super administradores pueden actualizar acceso a clientes')
  }

  // STEP 3: Find Target User and Validate is Affiliate
  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      affiliate: { select: { id: true } },
    },
  })

  if (!targetUser) {
    throw new NotFoundError('Usuario no encontrado')
  }

  if (!targetUser.affiliate) {
    throw new BadRequestError('Solo los afiliados pueden tener acceso a clientes')
  }

  // STEP 4: Validate All Client IDs Exist
  if (data.clientIds.length > 0) {
    const existingClients = await db.client.findMany({
      where: { id: { in: data.clientIds } },
      select: { id: true },
    })

    const existingIds = new Set(existingClients.map((c) => c.id))
    const invalidIds = data.clientIds.filter((id) => !existingIds.has(id))

    if (invalidIds.length > 0) {
      throw new NotFoundError(`Clientes no encontrados: ${invalidIds.join(', ')}`)
    }
  }

  // STEP 5: Transaction - Delete existing and create new
  await db.$transaction(async (tx) => {
    // Delete all existing client access
    await tx.userClient.deleteMany({
      where: { userId: targetUserId },
    })

    // Create new client access entries
    if (data.clientIds.length > 0) {
      await tx.userClient.createMany({
        data: data.clientIds.map((clientId) => ({
          userId: targetUserId,
          clientId,
          isActive: true,
        })),
      })
    }
  })

  // STEP 6: Log Activity
  logger.info(
    {
      userId,
      targetUserId,
      clientIds: data.clientIds,
      clientCount: data.clientIds.length,
    },
    'Client access updated'
  )

  // STEP 7: Return Response
  return {
    userId: targetUserId,
    clientAccessCount: data.clientIds.length,
    clientIds: data.clientIds,
    message: 'Acceso a clientes actualizado exitosamente',
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
