import type { ReactNode } from 'react'

interface FileListItemProps {
  /** File name */
  name: string
  /** File size in bytes */
  size: number
  /** MIME type for icon selection */
  mimeType: string
  /** Remove button callback */
  onRemove: () => void
  /** Optional: Render custom actions/content (e.g., category select) */
  children?: ReactNode
  /** Custom class name */
  className?: string
}

/**
 * File list item with icon, metadata, and remove action
 *
 * Use `children` prop to render custom content like category selects
 * or additional actions.
 *
 * @example
 * <FileListItem
 *   name="document.pdf"
 *   size={1024000}
 *   mimeType="application/pdf"
 *   onRemove={() => handleRemove(file.id)}
 * >
 *   <select value={category} onChange={handleCategoryChange}>
 *     <option value="OTHER">Otro</option>
 *   </select>
 * </FileListItem>
 */
export function FileListItem({
  name,
  size,
  mimeType,
  onRemove,
  children,
  className = '',
}: FileListItemProps) {
  const sizeInMB = (size / 1024 / 1024).toFixed(2)

  return (
    <div
      className={`group flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow ${className}`}
    >
      {/* File Icon */}
      <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
        {mimeType.includes('pdf') ? (
          <span className="text-red-500 font-bold text-[10px]">PDF</span>
        ) : mimeType.startsWith('image/') ? (
          <svg
            className="w-5 h-5 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
      </div>

      {/* File Info + Custom Content */}
      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <p className="text-sm font-medium text-gray-900 truncate" title={name}>
            {name}
          </p>
          <p className="text-xs text-gray-500">{sizeInMB} MB</p>
        </div>

        {/* Custom content slot (e.g., category select) */}
        {children}
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={onRemove}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
        aria-label={`Eliminar ${name}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}
