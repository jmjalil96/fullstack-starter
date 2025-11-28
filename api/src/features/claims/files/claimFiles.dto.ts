/**
 * claimFiles.dto.ts
 * DTOs for listing claim files
 */

/**
 * Single file item in the list
 */
export interface ClaimFileItem {
  /** File ID */
  id: string

  /** Original filename */
  originalName: string

  /** File size in bytes (as string due to BigInt) */
  fileSize: string

  /** MIME type */
  mimeType: string

  /** File category */
  category: string | null

  /** File description */
  description: string | null

  /** Name of user who uploaded */
  uploadedByName: string

  /** When the file was uploaded */
  uploadedAt: string
}

/**
 * Response for claim files list
 */
export interface ClaimFilesResponse {
  files: ClaimFileItem[]
}
