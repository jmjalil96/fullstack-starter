/**
 * DTOs for viewing/listing claims
 */

/**
 * Claim status enum values
 * Terminal states: APPROVED, REJECTED
 */
export type ClaimStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'

/**
 * Single claim item in list view
 * Lightweight summary with flat structure (no nested objects)
 */
export interface ClaimListItemResponse {
  // Core identification
  id: string
  claimNumber: string
  status: ClaimStatus

  // Client info (flat)
  clientId: string
  clientName: string

  // Affiliate info (flat)
  affiliateId: string
  affiliateFirstName: string
  affiliateLastName: string

  // Patient info (flat)
  patientId: string
  patientFirstName: string
  patientLastName: string

  // Financial data (if available)
  amount: number | null
  approvedAmount: number | null

  // Dates (ISO strings)
  submittedDate: string | null
  createdAt: string
}

/**
 * Query parameters for GET /api/claims
 */
export interface GetClaimsQueryParams {
  /** Filter by claim status */
  status?: ClaimStatus
  /** Filter by client (for broker employees) */
  clientId?: string
  /** Search by claim number (case-insensitive, exact match) */
  search?: string
  /** Page number (>= 1, default: 1) */
  page?: number
  /** Items per page (1-100, default: 20) */
  limit?: number
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  /** Total number of claims matching filters */
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
 * Response from GET /api/claims
 * Returns paginated list of claims with metadata
 */
export interface GetClaimsResponse {
  /** Array of claim summaries */
  claims: ClaimListItemResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata
}
