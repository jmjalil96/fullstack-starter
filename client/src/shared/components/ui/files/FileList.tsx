import type { ReactNode } from 'react'

import type { ClaimFileItem } from '../../../../features/files/files'
import { Button } from '../forms/Button'

/**
 * Format file size for display
 */
function formatFileSize(bytes: string | number): string {
  const size = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Format date for display
 */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Get file type icon based on MIME type
 */
function getFileIcon(mimeType: string): ReactNode {
  // PDF
  if (mimeType === 'application/pdf') {
    return (
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13H10v5H8.5v-5zm2.5 0h1.5l1.25 3.75L15 13h1.5v5H15v-3.25l-1 3.25h-1l-1-3.25V18H11v-5z" />
      </svg>
    )
  }

  // Images
  if (mimeType.startsWith('image/')) {
    return (
      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    )
  }

  // Default document icon
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}

interface FileListProps {
  /** Array of files to display */
  files: ClaimFileItem[]
  /** Loading state */
  isLoading?: boolean
  /** Callback when download is clicked */
  onDownload: (fileId: string) => void
  /** Callback when delete is clicked (optional, shows delete button if provided) */
  onDelete?: (fileId: string) => void
  /** ID of file currently being downloaded */
  downloadingId?: string
  /** ID of file currently being deleted */
  deletingId?: string
  /** Empty state message */
  emptyMessage?: string
  /** Map of category values to labels */
  categoryLabels?: Record<string, string>
}

/**
 * FileList - Display a list of files with download/delete actions
 *
 * @example
 * <FileList
 *   files={files}
 *   onDownload={(id) => downloadMutation.mutate(id)}
 *   onDelete={(id) => deleteMutation.mutate(id)}
 *   downloadingId={downloadMutation.isPending ? downloadingId : undefined}
 * />
 */
export function FileList({
  files,
  isLoading = false,
  onDownload,
  onDelete,
  downloadingId,
  deletingId,
  emptyMessage = 'No hay archivos adjuntos',
  categoryLabels = {},
}: FileListProps) {
  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200/50 rounded-xl" />
        ))}
      </div>
    )
  }

  // --- Empty State ---
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  // --- File List ---
  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-colors"
        >
          {/* File Icon */}
          <div className="flex-shrink-0">{getFileIcon(file.mimeType)}</div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{file.originalName}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
              <span>{formatFileSize(file.fileSize)}</span>
              {file.category && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {categoryLabels[file.category] || file.category}
                </span>
              )}
              <span>{file.uploadedByName}</span>
              <span>{formatDate(file.uploadedAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {/* Download Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(file.id)}
              disabled={downloadingId === file.id}
              isLoading={downloadingId === file.id}
              loadingText=""
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </Button>

            {/* Delete Button (optional) */}
            {onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(file.id)}
                disabled={deletingId === file.id}
                isLoading={deletingId === file.id}
                loadingText=""
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
