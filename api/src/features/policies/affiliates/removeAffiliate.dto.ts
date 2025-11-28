/**
 * DTOs for removing an affiliate from a policy
 */

import type { AffiliateType } from './policyAffiliates.dto.js'

/**
 * Request body for PATCH /api/policies/:policyId/affiliates/:affiliateId
 *
 * Sets the removal date and deactivates the affiliate-policy relationship.
 * For OWNER affiliates, cascades to all dependents on the same policy.
 */
export interface RemoveAffiliateFromPolicyRequest {
  /**
   * Date when the affiliate is removed from the policy (ISO 8601 format: YYYY-MM-DD)
   * Cannot be in the future
   * Cannot be before the addedAt date
   */
  removedAt: string
}

/**
 * Information about a removed affiliate (used in response)
 */
export interface RemovedAffiliateInfo {
  /** Affiliate ID */
  affiliateId: string
  /** Affiliate first name */
  affiliateFirstName: string
  /** Affiliate last name */
  affiliateLastName: string
  /** Affiliate type (OWNER or DEPENDENT) */
  affiliateType: AffiliateType
  /** Date when affiliate was added to policy (ISO 8601) */
  addedAt: string
  /** Date when affiliate was removed from policy (ISO 8601) */
  removedAt: string
}

/**
 * Response for successfully removing an affiliate from a policy
 *
 * Returns confirmation of removal plus any cascaded dependent removals.
 */
export interface RemoveAffiliateFromPolicyResponse {
  // ============================================================================
  // POLICY IDENTIFICATION
  // ============================================================================

  /** ID of the policy */
  policyId: string
  /** Policy number for display */
  policyNumber: string

  // ============================================================================
  // REMOVED AFFILIATE
  // ============================================================================

  /** Information about the removed affiliate */
  removedAffiliate: RemovedAffiliateInfo

  // ============================================================================
  // CASCADED DEPENDENTS
  // ============================================================================

  /**
   * List of dependents also removed (for OWNER removal)
   * Empty array if affiliate was DEPENDENT or OWNER with no dependents
   */
  cascadedDependents: RemovedAffiliateInfo[]
}
