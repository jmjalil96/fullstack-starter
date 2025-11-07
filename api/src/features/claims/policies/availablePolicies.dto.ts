/**
 * DTO for available policies endpoint
 *
 * Returns policies that can be assigned to a claim.
 * Filtered by:
 * - Claim's client (policy.clientId = claim.clientId)
 * - Affiliate coverage (affiliate must be in PolicyAffiliate join table)
 * - Active policies only (policy.isActive = true, status = ACTIVE, not expired)
 *
 * Used by: Edit claim form (policy dropdown selection)
 */

/**
 * Single policy option for dropdown
 * Contains minimal info needed for selection UI
 */
export interface AvailablePolicyResponse {
  /** Policy ID (for select value) */
  id: string

  /** Policy number (main display text) */
  policyNumber: string

  /** Policy type (e.g., "Salud", "Dental") - provides context */
  type: string | null

  /** Insurer name (e.g., "MAPFRE", "Sura") - provides context */
  insurerName: string
}
