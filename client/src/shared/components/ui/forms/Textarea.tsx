import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import type { FieldError } from 'react-hook-form'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label text */
  label?: string
  /** Validation error */
  error?: FieldError
  /** Visual variant */
  variant?: 'glass' | 'light'
  /** Required field indicator */
  required?: boolean
}

/**
 * Textarea component with built-in label and error handling
 * Matches Input design and API for consistency
 *
 * @example
 * <Controller
 *   name="description"
 *   control={control}
 *   render={({ field, fieldState }) => (
 *     <Textarea
 *       label="Descripción"
 *       variant="light"
 *       rows={4}
 *       error={fieldState.error}
 *       {...field}
 *     />
 *   )}
 * />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, variant = 'glass', className = '', required, ...props }, ref) => {
    const generatedId = useId()
    const textareaId = props.id || generatedId
    const errorId = error ? `${textareaId}-error` : undefined

    // Base styles shared across all variants
    const baseStyles =
      'w-full px-4 py-3 text-sm rounded-xl transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed resize-y'

    // Variant-specific styles
    const variants = {
      glass: {
        label: 'block text-xs font-medium text-gray-700 ml-1',
        textarea:
          'bg-white/60 backdrop-blur-sm border focus:border-transparent focus:bg-white/90 focus:ring-[var(--color-gold)]/50 text-[var(--color-navy)] placeholder-gray-400',
        textareaNormal: 'border-gray-200/50',
        textareaError: 'border-red-400/50 focus:ring-red-400/50',
        errorMessage: 'text-xs text-red-600 ml-1 animate-in slide-in-from-top-1',
      },
      light: {
        label: 'block text-xs font-bold text-[var(--color-navy)] uppercase tracking-wider ml-1',
        textarea:
          'bg-gray-50 border focus:border-[var(--color-navy)]/30 focus:ring-[var(--color-navy)]/10 text-[var(--color-navy)] placeholder-gray-400',
        textareaNormal: 'border-gray-200',
        textareaError: 'border-red-400 focus:ring-red-400',
        errorMessage: 'text-xs text-red-500 ml-1',
      },
    }

    const currentVariant = variants[variant]

    // If label or error exists, use wrapper with spacing
    if (label || error) {
      return (
        <div className="space-y-1.5 w-full">
          {label && (
            <label htmlFor={textareaId} className={currentVariant.label}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          <textarea
            ref={ref}
            id={textareaId}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={errorId}
            className={`${baseStyles} ${currentVariant.textarea} ${
              error ? currentVariant.textareaError : currentVariant.textareaNormal
            } ${className}`}
            {...props}
          />
          {error && <p id={errorId} className={currentVariant.errorMessage}>{error.message}</p>}
        </div>
      )
    }

    // Without label/error, use simple wrapper
    return (
      <textarea
        ref={ref}
        id={textareaId}
        className={`${baseStyles} ${currentVariant.textarea} ${currentVariant.textareaNormal} ${className}`}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'
