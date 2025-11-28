import { useRef, useState } from 'react'

interface FileDropzoneProps {
  /** Callback when files are selected (drag or click) */
  onFilesSelected: (files: File[]) => void
  /** Show loading/uploading state */
  loading?: boolean
  /** Accepted file types (e.g., ".pdf,.jpg,.png") */
  accept?: string
  /** Allow multiple file selection */
  multiple?: boolean
  /** Custom class name */
  className?: string
}

/**
 * Drag & drop file upload zone
 *
 * Supports drag & drop, click to select, and keyboard navigation.
 * Shows visual feedback during drag operations.
 *
 * @example
 * <FileDropzone
 *   onFilesSelected={(files) => handleUpload(files)}
 *   accept=".pdf,.jpg,.png"
 *   multiple
 *   loading={isUploading}
 * />
 */
export function FileDropzone({
  onFilesSelected,
  loading = false,
  accept = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx',
  multiple = true,
  className = '',
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) {
      onFilesSelected(Array.from(e.dataTransfer.files))
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fileInputRef.current?.click()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFilesSelected(Array.from(e.target.files))
    }
    e.target.value = ''
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label="Zona de carga de archivos. Haga clic o arrastre archivos aquí."
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
        ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
            : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/50'
        }
        ${loading ? 'opacity-50 pointer-events-none' : ''}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        className="hidden"
        onChange={handleChange}
        disabled={loading}
      />
      <div className="flex flex-col items-center gap-3">
        <div className="p-3 bg-white shadow-sm rounded-full border border-gray-100">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900">
            Haga clic o arrastre archivos aquí
          </p>
          <p className="text-xs text-gray-500">Soporta PDF, JPG, PNG, DOC (Max 50MB)</p>
        </div>
      </div>
    </div>
  )
}
