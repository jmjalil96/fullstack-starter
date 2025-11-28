/**
 * DTOs for viewing/listing claims
 */

/**
 * Claim status enum values (7-status workflow)
 * Terminal states: RETURNED, SETTLED, CANCELLED
 */
export type ClaimStatus =
  | 'DRAFT'
  | 'PENDING_INFO'
  | 'VALIDATION'
  | 'SUBMITTED'
  | 'RETURNED'
  | 'SETTLED'
  | 'CANCELLED'

/**
 * Care type enum values
 */
export type CareType = 'AMBULATORY' | 'HOSPITALIZATION' | 'MATERNITY' | 'EMERGENCY' | 'OTHER'

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

  // Diagnosis info
  careType: CareType | null

  // Financial data
  amountSubmitted: number | null
  amountApproved: number | null

  // Dates (ISO strings)
  submittedDate: string | null
  settlementDate: string | null
  createdAt: string
}

/** Valid date fields for filtering */
export type ClaimDateField = 'submittedDate' | 'createdAt' | 'incidentDate' | 'settlementDate'

/**
 * Query parameters for GET /api/claims
 */
export interface GetClaimsQueryParams {
  /** Filter by claim status */
  status?: ClaimStatus
  /** Filter by client (for broker employees) */
  clientId?: string
  /** Search by claim number, affiliate name, or patient name (partial match, case-insensitive) */
  search?: string
  /** Date field to filter on */
  dateField?: ClaimDateField
  /** Start date for range filter (ISO format: YYYY-MM-DD) */
  dateFrom?: string
  /** End date for range filter (ISO format: YYYY-MM-DD) */
  dateTo?: string
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
