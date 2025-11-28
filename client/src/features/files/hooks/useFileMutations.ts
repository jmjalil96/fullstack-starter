import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { FileEntityType } from '../files'
import { confirmUpload, deleteFile, getDownloadUrl, requestUploadUrl, uploadToR2 } from '../filesApi'

import { FILES_KEYS } from './useClaimFiles'

// ============================================================================
// UPLOAD FILE MUTATION
// ============================================================================

interface UploadFileParams {
  file: File
  entityType: FileEntityType
  entityId: string
  category?: string
  description?: string
}

/**
 * Hook to upload a file (full 3-step flow)
 *
 * Flow:
 * 1. Get presigned URL from API
 * 2. Upload file to R2 storage
 * 3. Confirm upload to create DB record
 *
 * @example
 * const uploadMutation = useUploadFile()
 *
 * const handleUpload = (file: File) => {
 *   uploadMutation.mutate(
 *     { file, entityType: 'CLAIM', entityId: claimId, category: 'RECEIPT' },
 *     {
 *       onSuccess: () => toast.success('Archivo subido'),
 *       onError: (error) => toast.error(error.message)
 *     }
 *   )
 * }
 */
export function useUploadFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, entityType, entityId, category, description }: UploadFileParams) => {
      // 1. Get presigned URL
      const uploadData = await requestUploadUrl({
        entityType,
        entityId,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        category,
        description,
      })

      // 2. Upload to R2
      await uploadToR2(uploadData.uploadUrl, file)

      // 3. Confirm upload
      return confirmUpload({
        storageKey: uploadData.storageKey,
        entityType,
        entityId,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        category,
        description,
      })
    },
    onSuccess: (_, variables) => {
      // Invalidate based on entity type
      if (variables.entityType === 'CLAIM') {
        queryClient.invalidateQueries({ queryKey: FILES_KEYS.claimFile(variables.entityId) })
      }
      // Add other entity types as needed
    },
  })
}

// ============================================================================
// DELETE FILE MUTATION
// ============================================================================

interface DeleteFileParams {
  fileId: string
  entityType: FileEntityType
  entityId: string
}

/**
 * Hook to delete a file (BROKER_EMPLOYEES only)
 *
 * @example
 * const deleteMutation = useDeleteFile()
 *
 * const handleDelete = (fileId: string) => {
 *   deleteMutation.mutate(
 *     { fileId, entityType: 'CLAIM', entityId: claimId },
 *     {
 *       onSuccess: () => toast.success('Archivo eliminado'),
 *       onError: (error) => toast.error(error.message)
 *     }
 *   )
 * }
 */
export function useDeleteFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileId }: DeleteFileParams) => deleteFile(fileId),
    onSuccess: (_, variables) => {
      // Invalidate based on entity type
      if (variables.entityType === 'CLAIM') {
        queryClient.invalidateQueries({ queryKey: FILES_KEYS.claimFile(variables.entityId) })
      }
      // Add other entity types as needed
    },
  })
}

// ============================================================================
// DOWNLOAD FILE MUTATION
// ============================================================================

/**
 * Hook to download a file
 *
 * Gets presigned download URL and triggers browser download.
 *
 * @example
 * const downloadMutation = useDownloadFile()
 *
 * const handleDownload = (fileId: string) => {
 *   downloadMutation.mutate(fileId, {
 *     onError: (error) => toast.error(error.message)
 *   })
 * }
 */
export function useDownloadFile() {
  return useMutation({
    mutationFn: async (fileId: string) => {
      const { downloadUrl, fileName } = await getDownloadUrl(fileId)

      // Trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return { downloadUrl, fileName }
    },
  })
}
