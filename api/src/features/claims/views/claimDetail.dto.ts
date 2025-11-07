/**
 * DTO for claim detail view (GET /api/claims/:id)
 */

import type { ClaimStatus } from './viewClaims.dto.js'

/**
 * Complete claim detail with all fields from Claim table
 * plus minimal references to related entities (id + display name)
 *
 * Follows flat structure pattern for consistency with ClaimListItemResponse
 */
export interface ClaimDetailResponse {
  // ============================================================================
  // CLAIM TABLE - ALL FIELDS
  // ============================================================================

  /** Unique claim ID (CUID) */
  id: string

  /** Sequential number from PostgreSQL sequence */
  claimSequence: number

  /** Human-readable claim number (RECL_XXXXXXXX format) */
  claimNumber: string

  /** Current claim status */
  status: ClaimStatus

  /** Claim type (optional categorization) */
  type: string | null

  /** Detailed description of the claim */
  description: string | null

  /** Claimed amount (optional) */
  amount: number | null

  /** Approved amount after processing (optional) */
  approvedAmount: number | null

  /** When the incident occurred (optional) */
  incidentDate: string | null

  /** When the claim was submitted (optional) */
  submittedDate: string | null

  /** When the claim was resolved (optional) */
  resolvedDate: string | null

  /** When the claim was created */
  createdAt: string

  /** When the claim was last updated */
  updatedAt: string

  // ============================================================================
  // RELATED ENTITIES - FLAT REFERENCES (ID + DISPLAY NAME)
  // ============================================================================

  /** Client ID */
  clientId: string

  /** Client name for display */
  clientName: string

  /** Affiliate ID (main owner who submitted the claim) */
  affiliateId: string

  /** Affiliate first name */
  affiliateFirstName: string

  /** Affiliate last name */
  affiliateLastName: string

  /** Patient ID (who received treatment - can be affiliate or dependent) */
  patientId: string

  /** Patient first name */
  patientFirstName: string

  /** Patient last name */
  patientLastName: string

  /** Relationship of patient to affiliate */
  patientRelationship: 'self' | 'dependent'

  /** Policy ID (optional - currently not assigned at creation) */
  policyId: string | null

  /** Policy number for display (optional) */
  policyNumber: string | null

  /** ID of user who created the claim */
  createdById: string

  /** Name of user who created the claim (optional) */
  createdByName: string | null
}
