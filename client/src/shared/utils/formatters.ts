/**
 * Shared formatting utilities for consistent display across the app
 * Locale: es-EC (Spanish - Uruguay)
 * Currency: USD
 */

/**
 * Format date to Spanish locale
 * @param date - ISO date string or null
 * @returns Formatted date string (DD/MMM/YYYY) or null
 * @example
 * formatDate("2025-11-22") → "22/nov/2025"
 * formatDate(null) → null
 */
export function formatDate(date: string | null): string | null {
  if (!date) return null
  return new Date(date).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format currency to Spanish (Uruguay) locale
 * @param amount - Amount in USD or null
 * @returns Formatted currency string or null
 * @example
 * formatCurrency(150.5) → "$150.50"
 * formatCurrency(null) → null
 */
export function formatCurrency(amount: number | null): string | null {
  if (amount === null) return null
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount)
}

/**
 * Format field value for display in diffs/comparisons
 * Handles different field types with appropriate formatting
 *
 * @param key - Field name
 * @param val - Field value (any type)
 * @param policyLookup - Optional lookup function for policy display
 * @returns Formatted string representation
 *
 * @example
 * formatFieldValue('amount', 150.5) → "$150.50"
 * formatFieldValue('incidentDate', '2025-11-22') → "22/nov/2025"
 * formatFieldValue('description', 'Test') → "Test"
 * formatFieldValue('policyId', 'abc123', getPolicyLabel) → "POL-001"
 */
export function formatFieldValue(
  key: string,
  val: unknown,
  policyLookup?: (id: string) => string | undefined
): string {
  // Null/undefined/empty
  if (val === null || val === undefined || val === '') return 'Vacío'

  // Currency fields
  if (['amount', 'approvedAmount'].includes(key) && typeof val === 'number') {
    return formatCurrency(val) || 'Vacío'
  }

  // Date fields
  if (['incidentDate', 'submittedDate', 'resolvedDate'].includes(key) && typeof val === 'string') {
    return formatDate(val) || 'Vacío'
  }

  // Policy ID (needs lookup)
  if (key === 'policyId' && typeof val === 'string' && policyLookup) {
    return policyLookup(val) || String(val)
  }

  // Default: convert to string
  return String(val)
}
