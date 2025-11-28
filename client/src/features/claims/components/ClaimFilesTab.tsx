import { useRef, useState } from 'react'

import { DetailSection } from '../../../shared/components/ui/data-display/DetailSection'
import { FileList } from '../../../shared/components/ui/files/FileList'
import { Button } from '../../../shared/components/ui/forms/Button'
import { SearchableSelect } from '../../../shared/components/ui/forms/SearchableSelect'
import { useToast } from '../../../shared/hooks/useToast'
import { CLAIM_FILE_CATEGORIES } from '../../files/files'
import { useClaimFiles } from '../../files/hooks/useClaimFiles'
import { useDeleteFile, useDownloadFile, useUploadFile } from '../../files/hooks/useFileMutations'

interface ClaimFilesTabProps {
  claimId: string
  /** Whether user can delete files (BROKER_EMPLOYEES only) */
  canDelete?: boolean
}

/** Map category values to display labels */
const CATEGORY_LABELS = Object.fromEntries(
  CLAIM_FILE_CATEGORIES.map((c) => [c.value, c.label])
)

/** Category options for dropdown */
const CATEGORY_OPTIONS = CLAIM_FILE_CATEGORIES.map((c) => ({
  value: c.value,
  label: c.label,
}))

/**
 * ClaimFilesTab - Tab content for viewing and uploading claim files
 *
 * Features:
 * - Popover upload: Click button → popover with category → select file
 * - File list with download/delete actions
 * - Delete only visible to BROKER_EMPLOYEES (via canDelete prop)
 */
export function ClaimFilesTab({ claimId, canDelete = false }: ClaimFilesTabProps) {
  const toast = useToast()

  // Popover state
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('OTHER')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Track which file is being actioned
  const [downloadingId, setDownloadingId] = useState<string | undefined>()
  const [deletingId, setDeletingId] = useState<string | undefined>()

  // Queries and mutations
  const { data, isLoading } = useClaimFiles(claimId)
  const uploadMutation = useUploadFile()
  const downloadMutation = useDownloadFile()
  const deleteMutation = useDeleteFile()

  // Handlers
  const handleUploadClick = () => {
    setPopoverOpen(true)
  }

  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPopoverOpen(false)
      uploadMutation.mutate(
        {
          file,
          entityType: 'CLAIM',
          entityId: claimId,
          category: selectedCategory,
        },
        {
          onSuccess: () => {
            toast.success('Archivo subido correctamente')
            setSelectedCategory('OTHER') // Reset for next upload
          },
          onError: (error) => {
            toast.error(error.message || 'Error al subir archivo')
          },
        }
      )
      // Reset input
      event.target.value = ''
    }
  }

  const handleDownload = (fileId: string) => {
    setDownloadingId(fileId)
    downloadMutation.mutate(fileId, {
      onSettled: () => setDownloadingId(undefined),
      onError: (error) => {
        toast.error(error.message || 'Error al descargar archivo')
      },
    })
  }

  const handleDelete = (fileId: string) => {
    setDeletingId(fileId)
    deleteMutation.mutate(
      { fileId, entityType: 'CLAIM', entityId: claimId },
      {
        onSuccess: () => {
          toast.success('Archivo eliminado')
        },
        onSettled: () => setDeletingId(undefined),
        onError: (error) => {
          toast.error(error.message || 'Error al eliminar archivo')
        },
      }
    )
  }

  return (
    <DetailSection
      title="Archivos"
      action={
        <div className="relative">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleUploadClick}
            disabled={uploadMutation.isPending}
            isLoading={uploadMutation.isPending}
            loadingText="Subiendo..."
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Subir archivo
          </Button>

          {/* Popover */}
          {popoverOpen && (
            <>
              {/* Backdrop */}
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setPopoverOpen(false)}
                aria-label="Cerrar menú"
              />

              {/* Popover content */}
              <div
                ref={popoverRef}
                className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl bg-white shadow-xl border border-gray-200 p-4"
              >
                <div className="space-y-4">
                  <div>
                    <SearchableSelect
                      label="Categoría del archivo"
                      options={CATEGORY_OPTIONS}
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                      placeholder="Seleccionar categoría"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPopoverOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSelectFile}
                      className="flex-1"
                    >
                      Seleccionar archivo
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      }
    >
      <FileList
        files={data?.files || []}
        isLoading={isLoading}
        onDownload={handleDownload}
        onDelete={canDelete ? handleDelete : undefined}
        downloadingId={downloadingId}
        deletingId={deletingId}
        categoryLabels={CATEGORY_LABELS}
        emptyMessage="No hay archivos adjuntos a este reclamo"
      />
    </DetailSection>
  )
}
