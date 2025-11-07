/**
 * LockedField - Display-only form field with lock indicator
 * Used for showing non-editable fields in edit modal with explanation
 */

/**
 * Props for LockedField component
 */
export interface LockedFieldProps {
  /** Field label */
  label: string
  /** Field value to display */
  value: string | number | null | undefined
  /** Reason why field is locked (e.g., "Editable en estado EN REVISIÓN") */
  reason: string
  /** Additional CSS classes */
  className?: string
  /** Optional formatter function for custom value display */
  formatter?: (value: string | number | null | undefined) => string
}

/**
 * LockedField - Display locked field with explanation
 *
 * Features:
 * - Matches form field visual style (disabled/locked appearance)
 * - Lock icon in label
 * - Explanation text below field (when it becomes editable)
 * - Handles null/undefined values gracefully
 * - Optional custom formatter for dates, currency, etc.
 * - Lower opacity to distinguish from editable fields
 *
 * @example
 * <LockedField
 *   label="Monto Aprobado"
 *   value={claim.approvedAmount}
 *   reason="Editable en estado EN REVISIÓN"
 * />
 *
 * @example
 * // With formatter for currency
 * <LockedField
 *   label="Monto"
 *   value={claim.amount}
 *   formatter={(v) => v ? `$${v.toFixed(2)}` : '—'}
 *   reason="Editable en estado SUBMITTED"
 * />
 */
export function LockedField({
  label,
  value,
  reason,
  className = '',
  formatter,
}: LockedFieldProps) {
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
      {/* Label with lock icon - matches Textarea/FormField pattern */}
      <label className="block text-sm font-medium text-[var(--color-navy)] mb-2">
        {label}
        <span className="text-xs text-gray-500 ml-2" title="Campo bloqueado">
          🔒
        </span>
      </label>

      {/* Value container - looks like disabled/locked input */}
      <div className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg bg-gray-50 opacity-60 cursor-not-allowed">
        <p className="text-[var(--color-text-secondary)]">{displayValue}</p>
      </div>

      {/* Explanation text - why it's locked and when it becomes editable */}
      <p className="mt-1 text-xs text-[var(--color-text-light)] italic">{reason}</p>
    </div>
  )
}
