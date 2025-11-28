/**
 * DTO for insurer detail view (GET /api/insurers/:id)
 */

/**
 * Complete insurer detail with all fields from Insurer table
 *
 * Follows flat structure pattern for consistency
 */
export interface InsurerDetailResponse {
  // ============================================================================
  // INSURER TABLE - ALL FIELDS
  // ============================================================================

  /** Unique insurer ID (CUID) */
  id: string

  /** Insurer name (unique business identifier) */
  name: string

  /** Insurer code (unique short code, e.g., "MAPFRE", "SURA") */
  code: string | null

  // Contact information
  /** Contact email */
  email: string | null

  /** Contact phone */
  phone: string | null

  /** Website URL */
  website: string | null

  // Billing configuration
  /** Day of month for billing cutoff (1-28) */
  billingCutoffDay: number

  // Status
  /** Whether insurer is active */
  isActive: boolean

  // Timestamps (ISO strings)
  /** When the insurer was created */
  createdAt: string

  /** When the insurer was last updated */
  updatedAt: string
}
