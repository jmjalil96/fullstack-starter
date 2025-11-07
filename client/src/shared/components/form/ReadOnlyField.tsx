/**
 * ReadOnlyField - Display-only form field with label
 * Used for showing claim data in detail view
 */

/**
 * Props for ReadOnlyField component
 */
export interface ReadOnlyFieldProps {
  /** Field label */
  label: string
  /** Field value to display */
  value: string | number | null | undefined
  /** Additional CSS classes */
  className?: string
  /** Optional formatter function for custom value display */
  formatter?: (value: string | number | null | undefined) => string
}

/**
 * ReadOnlyField - Display field value with label (non-editable)
 *
 * Features:
 * - Matches form field visual style (disabled appearance)
 * - Handles null/undefined values gracefully
 * - Optional custom formatter for dates, currency, etc.
 * - Consistent styling with editable form components
 *
 * @example
 * <ReadOnlyField label="Descripción" value={claim.description} />
 *
 * @example
 * // With formatter for currency
 * <ReadOnlyField
 *   label="Monto"
 *   value={claim.amount}
 *   formatter={(v) => v ? `$${v.toFixed(2)}` : '—'}
 * />
 *
 * @example
 * // With custom className
 * <ReadOnlyField
 *   label="Cliente"
 *   value={claim.clientName}
 *   className="mb-4"
 * />
 */
export function ReadOnlyField({
  label,
  value,
  className = '',
  formatter,
}: ReadOnlyFieldProps) {
  // Format value for display
  let displayValue: string

  if (formatter) {
    // Use custom formatter if provided
    displayValue = formatter(value)
  } else if (value === null || value === undefined) {
    // Default for empty values
    displayValue = '—'
  } else {
    // Default string conversion
    displayValue = String(value)
  }

  return (
    <div className={className}>
      {/* Label - matches Textarea/FormField pattern */}
      <label className="block text-sm font-medium text-[var(--color-navy)] mb-2">
        {label}
      </label>

      {/* Value container - looks like disabled input */}
      <div className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-secondary)]">
        <p className="text-[var(--color-text-primary)]">{displayValue}</p>
      </div>
    </div>
  )
}
