/**
 * downloadUrl.service.ts
 * Service for generating presigned download URLs
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { getDownloadUrl } from '../../../lib/storage.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { DownloadUrlResponse } from './downloadUrl.dto.js'

// ============================================================================
// CONSTANTS
// ============================================================================

const DOWNLOAD_URL_EXPIRY_SECONDS = 60 * 60 // 1 hour

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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
 * Generate a presigned download URL for a file
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can download any file
 * - CLIENT_ADMIN: Can download files from own client entities
 * - AFFILIATE: Can download files from own claims/tickets
 *
 * @param userId - ID of the requesting user
 * @param fileId - ID of the file to download
 * @returns Presigned download URL
 */
export async function requestDownloadUrl(
  userId: string,
  fileId: string
): Promise<DownloadUrlResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Load file record
  const file = await db.file.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      storageKey: true,
      originalName: true,
      mimeType: true,
      entityType: true,
      entityId: true,
      clientId: true,
      deletedAt: true,
      uploadedById: true,
    },
  })

  if (!file) {
    throw new NotFoundError('Archivo no encontrado')
  }

  // STEP 3: Check file is not deleted
  if (file.deletedAt) {
    throw new NotFoundError('Archivo no encontrado')
  }

  // STEP 4: Validate user has access to this file
  await validateFileAccess(user, file)

  // STEP 5: Generate presigned download URL
  const downloadUrl = await getDownloadUrl(file.storageKey, DOWNLOAD_URL_EXPIRY_SECONDS)

  // STEP 6: Log activity
  logger.info(
    {
      userId,
      fileId: file.id,
      entityType: file.entityType,
      entityId: file.entityId,
    },
    'Download URL generated'
  )

  // STEP 7: Return response
  return {
    downloadUrl,
    fileName: file.originalName,
    mimeType: file.mimeType,
    expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with all context needed for authorization
 */
async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      globalRole: { select: { name: true } },
      affiliate: { select: { id: true, clientId: true } },
      clientAccess: {
        where: { isActive: true },
        select: { clientId: true },
      },
    },
  })
}

/**
 * Validate that user has access to download this file
 */
async function validateFileAccess(
  user: UserContext,
  file: {
    entityType: string
    entityId: string
    clientId: string | null
    uploadedById: string
  }
): Promise<void> {
  const roleName = user.globalRole?.name
  const isBrokerEmployee = roleName ? BROKER_EMPLOYEES.includes(roleName as never) : false
  const isClientAdmin = roleName === 'CLIENT_ADMIN'
  const isAffiliate = roleName === 'AFFILIATE'

  // BROKER_EMPLOYEES can access any file
  if (isBrokerEmployee) {
    return
  }

  // CLIENT_ADMIN: Can access files from own client entities
  if (isClientAdmin) {
    // Check if file belongs to one of user's accessible clients
    if (file.clientId) {
      const hasAccess = user.clientAccess.some((uc) => uc.clientId === file.clientId)
      if (hasAccess) {
        return
      }
    }

    // For documents, check DocumentAccess
    if (file.entityType === 'DOCUMENT') {
      const hasDocAccess = await checkDocumentAccess(file.entityId, user.clientAccess)
      if (hasDocAccess) {
        return
      }
    }

    throw new ForbiddenError('No tienes acceso a este archivo')
  }

  // AFFILIATE: Can access files from own claims/tickets
  if (isAffiliate) {
    if (file.entityType === 'CLAIM') {
      const claim = await db.claim.findUnique({
        where: { id: file.entityId },
        select: { affiliateId: true },
      })

      if (claim && claim.affiliateId === user.affiliate?.id) {
        return
      }
    }

    if (file.entityType === 'TICKET') {
      const ticket = await db.ticket.findUnique({
        where: { id: file.entityId },
        select: { createdById: true },
      })

      if (ticket && ticket.createdById === user.id) {
        return
      }
    }

    // Check if it's a public document or one their client has access to
    if (file.entityType === 'DOCUMENT' && user.affiliate) {
      const hasDocAccess = await checkDocumentAccessForAffiliate(
        file.entityId,
        user.affiliate.clientId
      )
      if (hasDocAccess) {
        return
      }
    }

    throw new ForbiddenError('No tienes acceso a este archivo')
  }

  // Unknown role
  throw new ForbiddenError('No tienes permiso para descargar archivos')
}

/**
 * Check if any of the user's clients have access to a document
 */
async function checkDocumentAccess(
  entityId: string,
  clientAccess: { clientId: string }[]
): Promise<boolean> {
  // First check if document is public
  const document = await db.document.findFirst({
    where: {
      file: { entityId },
      isPublic: true,
      isActive: true,
    },
  })

  if (document) {
    return true
  }

  // Check DocumentAccess for any of user's clients
  const clientIds = clientAccess.map((c) => c.clientId)
  const access = await db.documentAccess.findFirst({
    where: {
      document: { file: { entityId } },
      clientId: { in: clientIds },
    },
  })

  return !!access
}

/**
 * Check if affiliate's client has access to a document
 */
async function checkDocumentAccessForAffiliate(
  entityId: string,
  clientId: string
): Promise<boolean> {
  // Check if document is public
  const document = await db.document.findFirst({
    where: {
      file: { entityId },
      isPublic: true,
      isActive: true,
    },
  })

  if (document) {
    return true
  }

  // Check DocumentAccess for affiliate's client
  const access = await db.documentAccess.findFirst({
    where: {
      document: { file: { entityId } },
      clientId,
    },
  })

  return !!access
}
