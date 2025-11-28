/**
 * pendingUpload.dto.ts
 * Data transfer objects for pending file upload
 */

export interface PendingUploadResponse {
  /** Presigned URL for direct upload to R2 */
  uploadUrl: string

  /** Storage key to use when linking file to entity */
  storageKey: string

  /** URL expiration time in seconds */
  expiresIn: number
}
