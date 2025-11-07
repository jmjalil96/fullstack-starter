/**
 * DateInput - Text input for ISO date format (YYYY-MM-DD)
 */

import { type InputHTMLAttributes, useId } from 'react'

/**
 * Props for DateInput component
 */
export interface DateInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Field label */
  label: string
  /** Optional error message (displays in red) */
  error?: string
  /** Optional helper text displayed below input */
  helperText?: string
}

/**
 * DateInput - Text input for ISO 8601 date format
 *
 * Features:
 * - Text input (not native date picker) for consistent UX
 * - ISO 8601 format: YYYY-MM-DD
 * - Browser pattern validation (HTML5)
 * - Zod schema validation (react-hook-form)
 * - Error message display
 * - Helper text support
 * - Full accessibility (aria attributes)
 * - Consistent styling with form components
 *
 * @example
 * <DateInput
 *   label="Fecha del Incidente"
 *   value={incidentDate}
 *   onChange={(e) => setIncidentDate(e.target.value)}
 *   helperText="Formato: YYYY-MM-DD"
 * />
 *
 * @example
 * // With react-hook-form Controller
 * <Controller
 *   name="incidentDate"
 *   control={control}
 *   render={({ field, fieldState }) => (
 *     <DateInput
 *       label="Fecha del Incidente"
 *       error={fieldState.error?.message}
 *       helperText="Formato: YYYY-MM-DD"
 *       {...field}
 *     />
 *   )}
 * />
 *
 * @example
 * // With error
 * <DateInput
 *   label="Fecha de Envío"
 *   value={value}
 *   onChange={onChange}
 *   error="Formato de fecha inválido (use YYYY-MM-DD)"
 * />
 */
export function DateInput({ label, error, helperText, className = '', ...inputProps }: DateInputProps) {
  const errorId = useId()
  const helperId = useId()
  const generatedId = useId()

  // Use provided id or generate one for label association
  const inputId = inputProps.id ?? generatedId

  // Calculate aria-describedby
  const ariaDescribedBy = error ? errorId : helperText ? helperId : undefined

  return (
    <div>
      {/* Label - matches Textarea/FormField pattern */}
      <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
        {label}
      </label>

      {/* Input - text type for ISO date format */}
      <input
        {...inputProps}
        id={inputId}
        type="text"
        placeholder="YYYY-MM-DD"
        pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
        inputMode="numeric"
        autoComplete="off"
        className={`w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed ${className}`}
        aria-invalid={!!error}
        aria-describedby={ariaDescribedBy}
      />

      {/* Helper Text (only shown if no error) */}
      {helperText && !error && (
        <p id={helperId} className="mt-1 text-xs text-[var(--color-text-light)]">
          {helperText}
        </p>
      )}

      {/* Error Message (takes priority over helper text) */}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
