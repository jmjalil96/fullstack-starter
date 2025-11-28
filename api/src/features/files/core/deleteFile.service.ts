/**
 * deleteFile.service.ts
 * Service for soft deleting files
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { DeleteFileResponse } from './deleteFile.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Soft delete a file (set deletedAt)
 *
 * Authorization:
 * - BROKER_EMPLOYEES only can delete files
 * - CLIENT_ADMIN and AFFILIATE cannot delete files
 *
 * @param userId - ID of the requesting user
 * @param fileId - ID of the file to delete
 * @returns Deleted file info
 */
export async function deleteFile(
  userId: string,
  fileId: string
): Promise<DeleteFileResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization - BROKER_EMPLOYEES only
  const roleName = user.globalRole?.name
  const isBrokerEmployee = roleName ? BROKER_EMPLOYEES.includes(roleName as never) : false

  if (!isBrokerEmployee) {
    logger.warn({ userId, role: roleName, fileId }, 'Unauthorized file deletion attempt')
    throw new ForbiddenError('No tienes permiso para eliminar archivos')
  }

  // STEP 3: Load file record
  const file = await db.file.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      storageKey: true,
      originalName: true,
      entityType: true,
      entityId: true,
      deletedAt: true,
    },
  })

  if (!file) {
    throw new NotFoundError('Archivo no encontrado')
  }

  // STEP 4: Check file is not already deleted
  if (file.deletedAt) {
    throw new NotFoundError('Archivo no encontrado')
  }

  // STEP 5: Soft delete - set deletedAt
  const deletedAt = new Date()

  await db.file.update({
    where: { id: fileId },
    data: { deletedAt },
  })

  // STEP 6: Log activity
  logger.info(
    {
      userId,
      fileId: file.id,
      storageKey: file.storageKey,
      originalName: file.originalName,
      entityType: file.entityType,
      entityId: file.entityId,
    },
    'File soft deleted'
  )

  // STEP 7: Return response
  return {
    id: file.id,
    deletedAt: deletedAt.toISOString(),
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with role context
 */
async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      globalRole: { select: { name: true } },
    },
  })
}
