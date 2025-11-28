/**
 * DTOs for invitable affiliates lookup
 */

/**
 * Query parameters for GET /api/affiliates/invitable
 */
export interface GetInvitableAffiliatesQueryParams {
  /** Filter by client ID */
  clientId?: string
  /** Search by name, email, or document number (case-insensitive, partial match) */
  search?: string
  /** Page number (>= 1, default: 1) */
  page?: number
  /** Items per page (1-100, default: 20) */
  limit?: number
}

/**
 * Single invitable affiliate item
 * Affiliates that can be invited (have email, no userId, isActive)
 */
export interface InvitableAffiliateResponse {
  /** Affiliate ID */
  id: string
  /** First name */
  firstName: string
  /** Last name */
  lastName: string
  /** Email address (required for invitation) */
  email: string
  /** Document number */
  documentNumber: string | null
  /** Client ID */
  clientId: string
  /** Client name */
  clientName: string
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
 * Response from GET /api/affiliates/invitable
 */
export interface GetInvitableAffiliatesResponse {
  /** Array of invitable affiliates */
  affiliates: InvitableAffiliateResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata
}
