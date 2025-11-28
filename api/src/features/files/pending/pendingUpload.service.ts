/**
 * pendingUpload.service.ts
 * Service for generating presigned upload URLs for pending files
 *
 * Pending files are uploaded BEFORE the parent entity (claim/ticket) exists.
 * They are stored with a special prefix and linked to the entity upon creation.
 */

// ============================================================================
// IMPORTS
// ============================================================================

import {
  getUploadUrl,
  isMimeTypeAllowed,
  isStorageConfigured,
} from '../../../lib/storage.js'
import { BadRequestError } from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { PendingUploadResponse } from './pendingUpload.dto.js'
import type { PendingUploadInput } from './pendingUpload.schema.js'

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Generate a presigned upload URL for a pending file
 *
 * Authorization:
 * - Any authenticated user can upload pending files
 * - The file is orphaned until linked to an entity during entity creation
 *
 * @param userId - ID of the requesting user
 * @param data - Pending upload request data
 * @returns Presigned upload URL and storage key
 */
export async function requestPendingUploadUrl(
  userId: string,
  data: PendingUploadInput
): Promise<PendingUploadResponse> {
  // STEP 1: Check storage is configured
  if (!isStorageConfigured()) {
    throw new BadRequestError('El almacenamiento de archivos no está configurado')
  }

  // STEP 2: Validate MIME type
  if (!isMimeTypeAllowed(data.mimeType)) {
    throw new BadRequestError(`Tipo de archivo no permitido: ${data.mimeType}`)
  }

  // STEP 3: Generate storage key with pending/ prefix
  // Format: pending/{userId}/{timestamp}-{sanitizedFilename}
  const storageKey = generatePendingStorageKey(userId, data.fileName)

  // STEP 4: Get presigned upload URL
  const { url, expiresIn } = await getUploadUrl(storageKey, data.mimeType, data.fileSize)

  // STEP 5: Log activity
  logger.info(
    {
      userId,
      intendedEntityType: data.intendedEntityType,
      fileName: data.fileName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      storageKey,
    },
    'Pending upload URL generated'
  )

  // STEP 6: Return response
  return {
    uploadUrl: url,
    storageKey,
    expiresIn,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a storage key for a pending file
 *
 * Format: pending/{userId}/{timestamp}-{sanitizedFilename}
 *
 * @param userId - ID of the uploading user
 * @param fileName - Original filename
 * @returns Storage key string
 */
function generatePendingStorageKey(userId: string, fileName: string): string {
  // Sanitize filename: remove special chars, replace spaces
  const sanitized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const timestamp = Date.now()

  return `pending/${userId}/${timestamp}-${sanitized}`
}
