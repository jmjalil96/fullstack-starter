/**
 * Textarea - Generic textarea component with character counter
 */

import { type TextareaHTMLAttributes, useId } from 'react'

/**
 * Props for Textarea component
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Field label */
  label: string
  /** Optional error message (displays in red) */
  error?: string
  /** Optional helper text displayed below textarea */
  helperText?: string
}

/**
 * Textarea - Accessible textarea with character counter
 *
 * Features:
 * - Character counter (if maxLength provided)
 * - Error message display
 * - Helper text support
 * - Full accessibility (aria attributes)
 * - Consistent styling with form components
 *
 * @example
 * <Textarea
 *   label="Descripción"
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 *   maxLength={5000}
 *   rows={6}
 *   placeholder="Describe el motivo..."
 * />
 *
 * @example
 * // With error
 * <Textarea
 *   label="Comentarios"
 *   value={value}
 *   onChange={onChange}
 *   error="La descripción es demasiado corta"
 * />
 */
export function Textarea({
  label,
  error,
  helperText,
  className = '',
  rows = 4,
  maxLength,
  value,
  ...textareaProps
}: TextareaProps) {
  const errorId = useId()
  const helperId = useId()

  // Calculate aria-describedby
  const ariaDescribedBy = error ? errorId : helperText ? helperId : undefined

  // Calculate current character count (handle both controlled and RHF modes)
  const currentLength = typeof value === 'string' ? value.length : 0

  return (
    <div>
      {/* Label */}
      <label
        htmlFor={textareaProps.id}
        className="block text-sm font-medium text-[var(--color-navy)] mb-2"
      >
        {label}
      </label>

      {/* Textarea */}
      <textarea
        {...textareaProps}
        {...(value !== undefined && { value })}
        rows={rows}
        maxLength={maxLength}
        className={`w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed resize-y ${className}`}
        aria-invalid={!!error}
        aria-describedby={ariaDescribedBy}
      />

      {/* Character Counter */}
      {maxLength && (
        <div className="mt-1 text-xs text-[var(--color-text-light)] text-right">
          {currentLength} / {maxLength}
        </div>
      )}

      {/* Error Message (takes priority over helper text) */}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Helper Text (only shown if no error) */}
      {helperText && !error && (
        <p id={helperId} className="mt-1 text-xs text-[var(--color-text-light)]">
          {helperText}
        </p>
      )}
    </div>
  )
}
