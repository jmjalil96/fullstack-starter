import { forwardRef, useId } from 'react'
import type { FieldError } from 'react-hook-form'

interface CheckboxProps {
  /** Checkbox label */
  label: string
  /** Checked state */
  checked?: boolean
  /** Change handler (receives boolean, not event) */
  onChange?: (checked: boolean) => void
  /** Validation error */
  error?: FieldError
  /** Visual variant */
  variant?: 'glass' | 'light'
  /** Disabled state */
  disabled?: boolean
  /** Required field indicator */
  required?: boolean
  /** Input ID */
  id?: string
  /** Input name */
  name?: string
}

/**
 * Checkbox component with built-in label and error handling
 * Matches Input design and API for consistency
 *
 * @example
 * <Controller
 *   name="isActive"
 *   control={control}
 *   render={({ field, fieldState }) => (
 *     <Checkbox
 *       label="Cliente Activo"
 *       checked={field.value}
 *       onChange={field.onChange}
 *       error={fieldState.error}
 *       variant="light"
 *     />
 *   )}
 * />
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, checked, onChange, error, variant = 'glass', disabled, required, id, name }, ref) => {
    const generatedId = useId()
    const checkboxId = id || generatedId
    const errorId = error ? `${checkboxId}-error` : undefined

    const variants = {
      glass: {
        label: 'text-sm font-medium text-gray-700',
        errorMessage: 'text-xs text-red-600 ml-1 animate-in slide-in-from-top-1',
      },
      light: {
        label: 'text-sm font-medium text-[var(--color-navy)]',
        errorMessage: 'text-xs text-red-500 ml-1',
      },
    }

    const currentVariant = variants[variant]

    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            name={name}
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.checked)}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={errorId}
            className="w-4 h-4 rounded border-gray-300 text-[var(--color-navy)] focus:ring-[var(--color-navy)] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor={checkboxId} className={currentVariant.label}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
        {error && <p id={errorId} className={currentVariant.errorMessage}>{error.message}</p>}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
