import { useRef } from 'react'

import { Button } from '../forms/Button'

interface FileUploadButtonProps {
  /** Callback when file is selected */
  onFileSelect: (file: File) => void
  /** Accepted file types (e.g., ".pdf,.jpg,.png") */
  accept?: string
  /** Disable the button */
  disabled?: boolean
  /** Show loading state */
  isLoading?: boolean
  /** Loading text */
  loadingText?: string
  /** Button text */
  children?: React.ReactNode
  /** Additional class names */
  className?: string
}

/**
 * File upload button component
 *
 * Wraps a hidden file input with a styled button.
 * Triggers file picker on click.
 *
 * @example
 * <FileUploadButton
 *   onFileSelect={(file) => uploadMutation.mutate(file)}
 *   accept=".pdf,.jpg,.png"
 *   isLoading={isUploading}
 * >
 *   Subir archivo
 * </FileUploadButton>
 */
export function FileUploadButton({
  onFileSelect,
  accept,
  disabled = false,
  isLoading = false,
  loadingText = 'Subiendo...',
  children = 'Subir archivo',
  className,
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileSelect(file)
      // Reset input so same file can be selected again
      event.target.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || isLoading}
      />
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={handleClick}
        disabled={disabled}
        isLoading={isLoading}
        loadingText={loadingText}
        className={className}
      >
        {/* Upload icon */}
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
        {children}
      </Button>
    </>
  )
}
