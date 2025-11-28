/**
 * storage.ts
 * R2/S3 storage service for file uploads
 *
 * Provides presigned URL generation for secure direct uploads/downloads
 * to Cloudflare R2 (S3-compatible storage).
 */

// ============================================================================
// IMPORTS
// ============================================================================

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { env } from '../config/env.js'
import { logger } from '../shared/middleware/logger.js'

// ============================================================================
// CONSTANTS
// ============================================================================

/** Presigned upload URL expiry (15 minutes) */
const UPLOAD_URL_EXPIRY_SECONDS = 15 * 60

/** Presigned download URL expiry (1 hour) */
const DOWNLOAD_URL_EXPIRY_SECONDS = 60 * 60

/** Default max file size (10MB) */
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024

/** Allowed MIME types for uploads */
const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Text
  'text/plain',
  'text/csv',
]

// ============================================================================
// CLIENT INITIALIZATION
// ============================================================================

let r2Client: S3Client | null = null

/**
 * Get or create the R2 S3Client instance (lazy singleton)
 */
function getR2Client(): S3Client {
  if (!r2Client) {
    const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT } = env

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
      throw new Error('R2 storage is not configured')
    }

    r2Client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })

    logger.info('R2 storage client initialized')
  }

  return r2Client
}

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Check if R2 storage is configured
 */
export function isStorageConfigured(): boolean {
  return !!(
    env.R2_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET_NAME &&
    env.R2_ENDPOINT
  )
}

/**
 * Generate a storage key for a file
 *
 * Format: {entityType}/{entityId}/{timestamp}-{sanitizedFileName}
 *
 * @param entityType - Type of entity (claims, invoices, tickets, documents)
 * @param entityId - ID of the parent entity
 * @param fileName - Original filename
 * @returns Storage key string
 */
export function generateStorageKey(
  entityType: string,
  entityId: string,
  fileName: string
): string {
  // Sanitize filename: remove special chars, replace spaces
  const sanitized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const timestamp = Date.now()

  return `${entityType}/${entityId}/${timestamp}-${sanitized}`
}

/**
 * Generate a presigned URL for uploading a file
 *
 * @param storageKey - The storage key (path) for the file
 * @param mimeType - MIME type of the file
 * @param maxSize - Maximum file size in bytes (default 10MB)
 * @returns Presigned upload URL and storage key
 */
export async function getUploadUrl(
  storageKey: string,
  mimeType: string,
  maxSize: number = DEFAULT_MAX_FILE_SIZE
): Promise<{ url: string; key: string; expiresIn: number }> {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`File type not allowed: ${mimeType}`)
  }

  const client = getR2Client()

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: storageKey,
    ContentType: mimeType,
    ContentLength: maxSize, // R2 will reject if file exceeds this
  })

  const url = await getSignedUrl(client, command, {
    expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
  })

  logger.debug({ storageKey, mimeType }, 'Generated upload URL')

  return {
    url,
    key: storageKey,
    expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
  }
}

/**
 * Generate a presigned URL for downloading a file
 *
 * @param storageKey - The storage key (path) of the file
 * @param expiresIn - URL expiry in seconds (default 1 hour)
 * @returns Presigned download URL
 */
export async function getDownloadUrl(
  storageKey: string,
  expiresIn: number = DOWNLOAD_URL_EXPIRY_SECONDS
): Promise<string> {
  const client = getR2Client()

  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: storageKey,
  })

  const url = await getSignedUrl(client, command, {
    expiresIn,
  })

  logger.debug({ storageKey, expiresIn }, 'Generated download URL')

  return url
}

/**
 * Get the public URL for a file (if bucket has public access enabled)
 *
 * @param storageKey - The storage key (path) of the file
 * @returns Public URL or null if not configured
 */
export function getPublicUrl(storageKey: string): string | null {
  if (!env.R2_PUBLIC_URL) {
    return null
  }

  return `${env.R2_PUBLIC_URL}/${storageKey}`
}

/**
 * Delete a file from storage
 *
 * @param storageKey - The storage key (path) of the file to delete
 */
export async function deleteFile(storageKey: string): Promise<void> {
  const client = getR2Client()

  const command = new DeleteObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: storageKey,
  })

  await client.send(command)

  logger.info({ storageKey }, 'File deleted from storage')
}

/**
 * Get allowed MIME types for file uploads
 */
export function getAllowedMimeTypes(): string[] {
  return [...ALLOWED_MIME_TYPES]
}

/**
 * Check if a MIME type is allowed
 */
export function isMimeTypeAllowed(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType)
}
