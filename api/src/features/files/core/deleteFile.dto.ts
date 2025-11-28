/**
 * deleteFile.dto.ts
 * DTOs for deleting files
 */

/**
 * Response after soft deleting a file
 */
export interface DeleteFileResponse {
  /** File ID */
  id: string

  /** When the file was deleted */
  deletedAt: string
}
