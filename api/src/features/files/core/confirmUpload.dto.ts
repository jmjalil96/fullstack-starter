/**
 * confirmUpload.dto.ts
 * DTOs for confirming file uploads
 */

/**
 * Response after confirming upload and creating File record
 */
export interface ConfirmUploadResponse {
  /** File ID */
  id: string

  /** Storage key in R2 */
  storageKey: string

  /** Original filename */
  originalName: string

  /** File size in bytes (as string due to BigInt) */
  fileSize: string

  /** MIME type */
  mimeType: string

  /** Entity type this file belongs to */
  entityType: string

  /** Entity ID this file belongs to */
  entityId: string

  /** When the file was uploaded */
  uploadedAt: string
}
