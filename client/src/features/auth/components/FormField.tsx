import { type InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Field label */
  label: string
  /** Optional helper text displayed below input */
  helperText?: string
  /** Optional error message (displays in red) */
  error?: string
}

/**
 * FormField - Standardized form input with label
 * Features:
 * - Consistent brand styling
 * - Teal focus ring
 * - Optional helper text
 * - Optional error message
 * - Disabled state handling
 * - Full accessibility support
 */
export function FormField({ label, helperText, error, className = '', ...inputProps }: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={inputProps.id}
        className="block text-sm font-medium text-[var(--color-navy)] mb-2"
      >
        {label}
      </label>
      <input
        {...inputProps}
        className={`w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed ${className}`}
      />
      {helperText && <p className="mt-1 text-xs text-[var(--color-text-light)]">{helperText}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
