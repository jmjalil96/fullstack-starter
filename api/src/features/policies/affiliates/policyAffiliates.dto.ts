/**
 * DTOs for viewing affiliates covered under a policy
 */

/**
 * Affiliate type enum values
 */
export type AffiliateType = 'OWNER' | 'DEPENDENT'

/**
 * Coverage type enum values
 */
export type CoverageType = 'T' | 'TPLUS1' | 'TPLUSF'

/**
 * Query parameters for GET /api/policies/:policyId/affiliates
 */
export interface GetPolicyAffiliatesQueryParams {
  /** Search by first name, last name, or document number (case-insensitive, partial match) */
  search?: string
  /** Filter by affiliate type */
  affiliateType?: AffiliateType
  /** Filter by active status (undefined = all, true = active only, false = inactive only) */
  isActive?: boolean
  /** Page number (>= 1, default: 1) */
  page?: number
  /** Items per page (1-100, default: 20) */
  limit?: number
}

/**
 * Single affiliate covered under a policy
 * Simplified response for policy affiliates list view
 */
export interface PolicyAffiliateResponse {
  // Affiliate identification
  id: string
  firstName: string
  lastName: string

  // Type & coverage
  affiliateType: AffiliateType
  coverageType: CoverageType | null

  // Policy membership dates (ISO strings)
  addedAt: string
  removedAt: string | null

  // Status (from PolicyAffiliate junction, not Affiliate)
  isActive: boolean
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  /** Total number of affiliates matching filters */
  total: number
  /** Current page number */
  page: number
  /** Items per page */
  limit: number
  /** Total number of pages */
  totalPages: number
  /** Whether there are more pages */
  hasMore: boolean
}

/**
 * Response from GET /api/policies/:policyId/affiliates
 * Returns paginated list of affiliates covered under the policy
 */
export interface GetPolicyAffiliatesResponse {
  /** Array of affiliates covered under this policy */
  affiliates: PolicyAffiliateResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata
}
