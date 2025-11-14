/**
 * DTO for affiliate detail view (GET /api/affiliates/:id)
 */

/**
 * Complete affiliate detail with all fields from Affiliate table
 * plus minimal references to related entities (id + display name)
 *
 * Follows flat structure pattern for consistency with other detail views
 */
export interface AffiliateDetailResponse {
  // ============================================================================
  // AFFILIATE TABLE - ALL FIELDS
  // ============================================================================

  /** Unique affiliate ID (CUID) */
  id: string

  // Core identification
  /** Affiliate first name */
  firstName: string

  /** Affiliate last name */
  lastName: string

  // Personal information
  /** Contact email (optional) */
  email: string | null

  /** Contact phone (optional) */
  phone: string | null

  /** Date of birth in ISO format YYYY-MM-DD (optional) */
  dateOfBirth: string | null

  /** Document type (e.g., CI, RUC, Passport) - optional */
  documentType: string | null

  /** Document number (optional) */
  documentNumber: string | null

  // Classification
  /** Type of affiliate - owner or dependent */
  affiliateType: 'OWNER' | 'DEPENDENT'

  /** Coverage type for the affiliate (optional) */
  coverageType: 'T' | 'TPLUS1' | 'TPLUSF' | null

  // Account and status
  /** Whether the affiliate has a user account */
  hasUserAccount: boolean

  /** Whether the affiliate is active */
  isActive: boolean

  // Timestamps
  /** When the affiliate was created */
  createdAt: string

  /** When the affiliate was last updated */
  updatedAt: string

  // ============================================================================
  // RELATED ENTITIES - FLAT REFERENCES (ID + DISPLAY NAME)
  // ============================================================================

  /** Client ID */
  clientId: string

  /** Client name for display */
  clientName: string

  /** Primary affiliate ID (for dependents) - null for owners */
  primaryAffiliateId: string | null

  /** Primary affiliate first name (for dependents) - null for owners */
  primaryAffiliateFirstName: string | null

  /** Primary affiliate last name (for dependents) - null for owners */
  primaryAffiliateLastName: string | null
}
