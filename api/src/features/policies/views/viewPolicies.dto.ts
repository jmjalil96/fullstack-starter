/**
 * DTOs for viewing/listing policies
 */

/**
 * Policy status enum values
 */
export type PolicyStatus = 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED'

/**
 * Query parameters for GET /api/policies
 */
export interface GetPoliciesQueryParams {
  /** Filter by policy status */
  status?: PolicyStatus
  /** Filter by client */
  clientId?: string
  /** Filter by insurer */
  insurerId?: string
  /** Search by policy number (case-insensitive, exact match) */
  search?: string
  /** Page number (>= 1, default: 1) */
  page?: number
  /** Items per page (1-100, default: 20) */
  limit?: number
}

/**
 * Single policy item in list view
 * Flat structure (no nested objects)
 */
export interface PolicyListItemResponse {
  // Core identification
  id: string
  policyNumber: string
  status: PolicyStatus
  type: string | null

  // Client info (flat)
  clientId: string
  clientName: string

  // Insurer info (flat)
  insurerId: string
  insurerName: string

  // Coverage period (date-only strings YYYY-MM-DD)
  startDate: string
  endDate: string

  // Status
  isActive: boolean

  // Dates (ISO strings)
  createdAt: string
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  /** Total number of policies matching filters */
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
 * Response from GET /api/policies
 * Returns paginated list of policies with metadata
 */
export interface GetPoliciesResponse {
  /** Array of policy summaries */
  policies: PolicyListItemResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata
}
