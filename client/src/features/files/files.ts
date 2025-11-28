/**
 * Files type definitions
 * Mirrors backend DTOs from api/src/features/files/core/*.dto.ts
 * and api/src/features/claims/files/claimFiles.dto.ts
 */

// ============================================================================
// CLAIM FILE TYPES
// ============================================================================

/**
 * Single claim file item
 * Returned from GET /api/claims/:claimId/files
 * Mirrors backend: api/src/features/claims/files/claimFiles.dto.ts
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
  /** When the file was uploaded (ISO string) */
  uploadedAt: string
}

/**
 * Response from GET /api/claims/:claimId/files
 */
export interface ClaimFilesResponse {
  files: ClaimFileItem[]
}

// ============================================================================
// PENDING UPLOAD TYPES (for entity creation flows)
// ============================================================================

/**
 * Intended entity types for pending uploads
 */
export type PendingEntityType = 'CLAIM' | 'TICKET'

/**
 * Request body for pending upload URL
 * Sent to POST /api/files/pending-upload-url
 */
export interface PendingUploadRequest {
  fileName: string
  mimeType: string
  fileSize: number
  intendedEntityType: PendingEntityType
}

/**
 * Response from POST /api/files/pending-upload-url
 */
export interface PendingUploadResponse {
  uploadUrl: string
  storageKey: string
  expiresIn: number
}

/**
 * Local state for tracking pending files before entity creation
 */
export interface PendingFile {
  storageKey: string
  name: string
  size: number
  type: string
  category?: string
}

// ============================================================================
// UPLOAD FLOW TYPES
// ============================================================================

/**
 * Entity types that can have files attached
 */
export type FileEntityType = 'CLAIM' | 'INVOICE' | 'TICKET' | 'DOCUMENT'

/**
 * Request body for upload URL
 * Sent to POST /api/files/upload-url
 * Mirrors backend: api/src/features/files/core/uploadUrl.dto.ts
 */
export interface UploadUrlRequest {
  entityType: FileEntityType
  entityId: string
  fileName: string
  mimeType: string
  fileSize: number
  category?: string
  description?: string
}

/**
 * Response from POST /api/files/upload-url
 */
export interface UploadUrlResponse {
  uploadUrl: string
  storageKey: string
  expiresIn: number
}

/**
 * Request body for confirming upload
 * Sent to POST /api/files/confirm
 * Mirrors backend: api/src/features/files/core/confirmUpload.dto.ts
 */
export interface ConfirmUploadRequest {
  storageKey: string
  entityType: FileEntityType
  entityId: string
  originalName: string
  fileSize: number
  mimeType: string
  category?: string
  description?: string
}

/**
 * Response from POST /api/files/confirm
 */
export interface ConfirmUploadResponse {
  fileId: string
  message: string
}

// ============================================================================
// DOWNLOAD TYPES
// ============================================================================

/**
 * Response from GET /api/files/:id/download-url
 * Mirrors backend: api/src/features/files/core/downloadUrl.dto.ts
 */
export interface DownloadUrlResponse {
  downloadUrl: string
  fileName: string
  expiresIn: number
}

// ============================================================================
// FILE CATEGORIES
// ============================================================================

/**
 * Claim file categories (match Prisma enum ClaimFileCategory)
 */
export const CLAIM_FILE_CATEGORIES = [
  { value: 'RECEIPT', label: 'Recibo' },
  { value: 'PRESCRIPTION', label: 'Receta' },
  { value: 'LAB_REPORT', label: 'Resultado de laboratorio' },
  { value: 'DISCHARGE_SUMMARY', label: 'Resumen de alta' },
  { value: 'AUTHORIZATION', label: 'Autorización' },
  { value: 'OTHER', label: 'Otro' },
] as const

export type ClaimFileCategory = (typeof CLAIM_FILE_CATEGORIES)[number]['value']
