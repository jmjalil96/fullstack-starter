/**
 * uploadUrl.dto.ts
 * DTOs for requesting presigned upload URLs
 */

/**
 * Response containing presigned upload URL
 */
export interface UploadUrlResponse {
  /** Presigned URL for direct upload to R2 */
  uploadUrl: string

  /** Storage key to use when confirming upload */
  storageKey: string

  /** URL expiration time in seconds */
  expiresIn: number
}
