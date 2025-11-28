/**
 * Files API service layer
 * Type-safe wrappers around fetchAPI for file endpoints
 */

import { fetchAPI } from '../../config/api'

import type {
  ClaimFilesResponse,
  ConfirmUploadRequest,
  ConfirmUploadResponse,
  DownloadUrlResponse,
  PendingUploadRequest,
  PendingUploadResponse,
  UploadUrlRequest,
  UploadUrlResponse,
} from './files'

// ============================================================================
// CLAIM FILES
// ============================================================================

/**
 * Get all files attached to a claim
 *
 * @param claimId - Claim ID to fetch files for
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns List of files attached to the claim
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const { files } = await getClaimFiles('claim-123')
 * // Returns: { files: [{ id: '...', originalName: 'receipt.pdf', ... }, ...] }
 */
export async function getClaimFiles(
  claimId: string,
  options?: RequestInit
): Promise<ClaimFilesResponse> {
  return fetchAPI<ClaimFilesResponse>(`/api/claims/${claimId}/files`, options)
}

// ============================================================================
// PENDING UPLOAD FLOW (for entity creation)
// ============================================================================

/**
 * Request a presigned URL for pending file upload
 *
 * Use this when uploading files BEFORE the entity (claim/ticket) exists.
 * The file will be stored with a pending/ prefix and linked to the entity
 * during entity creation.
 *
 * @param data - Pending upload request data
 * @param options - Optional RequestInit options
 * @returns Presigned upload URL and storage key
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const { uploadUrl, storageKey } = await requestPendingUploadUrl({
 *   fileName: 'receipt.pdf',
 *   mimeType: 'application/pdf',
 *   fileSize: 12345,
 *   intendedEntityType: 'CLAIM'
 * })
 */
export async function requestPendingUploadUrl(
  data: PendingUploadRequest,
  options?: RequestInit
): Promise<PendingUploadResponse> {
  return fetchAPI<PendingUploadResponse>('/api/files/pending-upload-url', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  })
}

// ============================================================================
// UPLOAD FLOW
// ============================================================================

/**
 * Request a presigned URL for file upload
 *
 * @param data - Upload request data (entity, file info)
 * @param options - Optional RequestInit options
 * @returns Presigned upload URL and storage key
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const { uploadUrl, storageKey } = await requestUploadUrl({
 *   entityType: 'CLAIM',
 *   entityId: 'claim-123',
 *   fileName: 'receipt.pdf',
 *   mimeType: 'application/pdf',
 *   fileSize: 12345,
 *   category: 'RECEIPT'
 * })
 */
export async function requestUploadUrl(
  data: UploadUrlRequest,
  options?: RequestInit
): Promise<UploadUrlResponse> {
  return fetchAPI<UploadUrlResponse>('/api/files/upload-url', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * Upload file directly to R2 storage using presigned URL
 *
 * This bypasses our API and uploads directly to Cloudflare R2.
 *
 * @param uploadUrl - Presigned PUT URL from requestUploadUrl
 * @param file - File to upload
 * @throws {Error} If upload fails
 *
 * @example
 * await uploadToR2(uploadUrl, file)
 */
export async function uploadToR2(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
  }
}

/**
 * Confirm file upload and create database record
 *
 * Call this after successful upload to R2 to create the File record
 * and link it to the entity (ClaimFile, InvoiceFile, etc).
 *
 * @param data - Confirmation data matching the upload
 * @param options - Optional RequestInit options
 * @returns File ID and success message
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const { fileId } = await confirmUpload({
 *   storageKey: 'claim/abc123/1234567890-receipt.pdf',
 *   entityType: 'CLAIM',
 *   entityId: 'claim-123',
 *   originalName: 'receipt.pdf',
 *   fileSize: 12345,
 *   mimeType: 'application/pdf',
 *   category: 'RECEIPT'
 * })
 */
export async function confirmUpload(
  data: ConfirmUploadRequest,
  options?: RequestInit
): Promise<ConfirmUploadResponse> {
  return fetchAPI<ConfirmUploadResponse>('/api/files/confirm', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  })
}

// ============================================================================
// DOWNLOAD
// ============================================================================

/**
 * Get a presigned download URL for a file
 *
 * @param fileId - File ID to download
 * @param options - Optional RequestInit options
 * @returns Presigned download URL (valid for 1 hour)
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const { downloadUrl, fileName } = await getDownloadUrl('file-123')
 * // Open in new tab or trigger download
 */
export async function getDownloadUrl(
  fileId: string,
  options?: RequestInit
): Promise<DownloadUrlResponse> {
  return fetchAPI<DownloadUrlResponse>(`/api/files/${fileId}/download-url`, options)
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Soft delete a file (BROKER_EMPLOYEES only)
 *
 * Sets deletedAt timestamp, doesn't physically remove from R2.
 *
 * @param fileId - File ID to delete
 * @param options - Optional RequestInit options
 * @throws {ApiRequestError} If request fails or user lacks permission
 *
 * @example
 * await deleteFile('file-123')
 */
export async function deleteFile(fileId: string, options?: RequestInit): Promise<void> {
  await fetchAPI(`/api/files/${fileId}`, {
    method: 'DELETE',
    ...options,
  })
}
