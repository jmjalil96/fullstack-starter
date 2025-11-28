/**
 * downloadUrl.dto.ts
 * DTOs for requesting presigned download URLs
 */

/**
 * Response containing presigned download URL
 */
export interface DownloadUrlResponse {
  /** Presigned URL for downloading the file */
  downloadUrl: string

  /** Original filename */
  fileName: string

  /** MIME type */
  mimeType: string

  /** URL expiration time in seconds */
  expiresIn: number
}
