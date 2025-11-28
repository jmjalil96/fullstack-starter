/**
 * Date utility functions
 * Shared helpers for date calculations, normalization, and comparisons
 */

/**
 * Calculate days between two dates (inclusive)
 *
 * Includes both start and end dates in the count.
 * Example: Jan 1 to Jan 3 = 3 days (1st, 2nd, 3rd)
 *
 * @param start - Start date
 * @param end - End date
 * @returns Number of days (inclusive), minimum 1
 *
 * @example
 * daysBetweenInclusive(new Date('2025-01-01'), new Date('2025-01-31'))
 * // Returns: 31 (full month)
 *
 * daysBetweenInclusive(new Date('2025-01-15'), new Date('2025-01-31'))
 * // Returns: 17 (partial month)
 */
export function daysBetweenInclusive(start: Date, end: Date): number {
  const msPerDay = 86400000 // 24 * 60 * 60 * 1000
  const diffMs = end.getTime() - start.getTime()
  return Math.floor(diffMs / msPerDay) + 1
}

/**
 * Normalize date to midnight UTC
 *
 * Removes time component, sets to 00:00:00.000 UTC
 * Ensures consistent date comparisons without time-of-day issues
 *
 * @param date - Date to normalize
 * @returns New Date at midnight UTC
 *
 * @example
 * normalizeToMidnight(new Date('2025-01-15T14:30:00'))
 * // Returns: Date('2025-01-15T00:00:00.000Z')
 */
export function normalizeToMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
}

/**
 * Get the maximum (later) of two dates
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns The later date
 *
 * @example
 * maxDate(new Date('2025-01-01'), new Date('2025-01-15'))
 * // Returns: Date('2025-01-15')
 */
export function maxDate(date1: Date, date2: Date): Date {
  return date1 > date2 ? date1 : date2
}

/**
 * Get the minimum (earlier) of two dates
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns The earlier date
 *
 * @example
 * minDate(new Date('2025-01-01'), new Date('2025-01-15'))
 * // Returns: Date('2025-01-01')
 */
export function minDate(date1: Date, date2: Date): Date {
  return date1 < date2 ? date1 : date2
}

/**
 * Parse billing period (YYYY-MM) to date range
 *
 * Converts billing period string to start/end dates and day count
 * Dates normalized to midnight UTC
 *
 * @param billingPeriod - Period in YYYY-MM format (e.g., "2025-01")
 * @returns Object with periodStart, periodEnd, daysInPeriod
 * @throws {Error} If format is invalid
 *
 * @example
 * parseBillingPeriod('2025-01')
 * // Returns: {
 * //   periodStart: Date('2025-01-01T00:00:00.000Z'),
 * //   periodEnd: Date('2025-01-31T00:00:00.000Z'),
 * //   daysInPeriod: 31
 * // }
 *
 * parseBillingPeriod('2025-02')
 * // Returns: {
 * //   periodStart: Date('2025-02-01T00:00:00.000Z'),
 * //   periodEnd: Date('2025-02-28T00:00:00.000Z'),
 * //   daysInPeriod: 28
 * // }
 */
export function parseBillingPeriod(billingPeriod: string): {
  periodStart: Date
  periodEnd: Date
  daysInPeriod: number
} {
  const match = billingPeriod.match(/^(\d{4})-(\d{2})$/)

  if (!match) {
    throw new Error(`Invalid billing period format: ${billingPeriod}. Expected YYYY-MM`)
  }

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)

  if (month < 1 || month > 12) {
    throw new Error(`Invalid month in billing period: ${month}. Must be 01-12`)
  }

  // First day of month (midnight UTC)
  const periodStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))

  // Last day of month (midnight UTC) - day 0 of next month = last day of current month
  const periodEnd = new Date(Date.UTC(year, month, 0, 0, 0, 0, 0))

  const daysInPeriod = daysBetweenInclusive(periodStart, periodEnd)

  return { periodStart, periodEnd, daysInPeriod }
}

// ============================================================================
// BILLING CUTOFF UTILITIES (T+1 Lagged Billing Model)
// ============================================================================

/**
 * Get cutoff date for a given month
 *
 * Returns the billing cutoff date at midnight UTC.
 * Example: cutoff day 25 for January 2025 = Jan 25, 2025 00:00:00 UTC
 *
 * @param year - Year
 * @param month - Month (1-12)
 * @param cutoffDay - Day of month for cutoff (1-28)
 * @returns Date at midnight UTC
 *
 * @example
 * getCutoffDate(2025, 1, 25)
 * // Returns: Date('2025-01-25T00:00:00.000Z')
 */
export function getCutoffDate(year: number, month: number, cutoffDay: number): Date {
  // Cap cutoff day at 28 to avoid issues with short months
  const safeCutoffDay = Math.min(cutoffDay, 28)
  return new Date(Date.UTC(year, month - 1, safeCutoffDay, 0, 0, 0, 0))
}

/**
 * Get the adjustment window and base cutoff for an invoice
 *
 * For T+1 lagged billing model:
 * - Invoice M bills based on (M-1 cutoff snapshot) + adjustments for activity in (M-2 cutoff → M-1 cutoff]
 * - baseCutoff: M-1 cutoff (affiliates active here = base billing)
 * - windowStart: M-2 cutoff (exclusive - activity AFTER this date)
 * - windowEnd: M-1 cutoff (inclusive - activity up to and including this date)
 *
 * @param billingPeriod - Invoice billing period in "YYYY-MM" format
 * @param cutoffDay - Day of month for cutoff (1-28)
 * @returns Object with windowStart, windowEnd, baseCutoff dates
 *
 * @example
 * // For February 2025 invoice with cutoff day 25:
 * getAdjustmentWindow('2025-02', 25)
 * // Returns: {
 * //   windowStart: Date('2024-12-25T00:00:00.000Z'), // Dec 25 (M-2 cutoff)
 * //   windowEnd: Date('2025-01-25T00:00:00.000Z'),   // Jan 25 (M-1 cutoff)
 * //   baseCutoff: Date('2025-01-25T00:00:00.000Z'),  // Jan 25 (same as windowEnd)
 * // }
 *
 * @example
 * // For January 2025 invoice with cutoff day 25:
 * getAdjustmentWindow('2025-01', 25)
 * // Returns: {
 * //   windowStart: Date('2024-11-25T00:00:00.000Z'), // Nov 25 (M-2 cutoff)
 * //   windowEnd: Date('2024-12-25T00:00:00.000Z'),   // Dec 25 (M-1 cutoff)
 * //   baseCutoff: Date('2024-12-25T00:00:00.000Z'),  // Dec 25 (same as windowEnd)
 * // }
 */
export function getAdjustmentWindow(
  billingPeriod: string,
  cutoffDay: number
): {
  windowStart: Date
  windowEnd: Date
  baseCutoff: Date
} {
  const match = billingPeriod.match(/^(\d{4})-(\d{2})$/)

  if (!match) {
    throw new Error(`Invalid billing period format: ${billingPeriod}. Expected YYYY-MM`)
  }

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)

  if (month < 1 || month > 12) {
    throw new Error(`Invalid month in billing period: ${month}. Must be 01-12`)
  }

  // M-1 cutoff (base cutoff) = previous month's cutoff day
  // For Feb 2025 (month=2), M-1 is Jan 2025 (month=1)
  let baseCutoffYear = year
  let baseCutoffMonth = month - 1
  if (baseCutoffMonth < 1) {
    baseCutoffMonth = 12
    baseCutoffYear -= 1
  }
  const baseCutoff = getCutoffDate(baseCutoffYear, baseCutoffMonth, cutoffDay)

  // M-2 cutoff (window start) = two months back
  // For Feb 2025 (month=2), M-2 is Dec 2024 (month=12)
  let windowStartYear = year
  let windowStartMonth = month - 2
  if (windowStartMonth < 1) {
    windowStartMonth += 12
    windowStartYear -= 1
  }
  const windowStart = getCutoffDate(windowStartYear, windowStartMonth, cutoffDay)

  // windowEnd = baseCutoff (M-1 cutoff, inclusive)
  const windowEnd = baseCutoff

  return { windowStart, windowEnd, baseCutoff }
}

/**
 * Get days in a specific month
 *
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Number of days in the month
 *
 * @example
 * getDaysInMonth(2025, 2) // Returns 28 (non-leap year)
 * getDaysInMonth(2024, 2) // Returns 29 (leap year)
 * getDaysInMonth(2025, 1) // Returns 31
 */
export function getDaysInMonth(year: number, month: number): number {
  // Day 0 of next month = last day of current month
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}
