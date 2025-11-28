/**
 * DTOs for viewing/listing insurers
 */

/**
 * Query parameters for GET /api/insurers
 */
export interface GetInsurersQueryParams {
  /** Search by name or code (case-insensitive, contains match) */
  search?: string
  /** Filter by active status */
  isActive?: boolean
  /** Page number (>= 1, default: 1) */
  page?: number
  /** Items per page (1-100, default: 10) */
  limit?: number
}

/**
 * Single insurer item in list view
 * Flat structure (no nested objects)
 */
export interface InsurerListItemResponse {
  // Core identification
  id: string
  name: string
  code: string | null

  // Contact info
  email: string | null
  phone: string | null

  // Billing configuration
  /** Day of month for billing cutoff (1-28) */
  billingCutoffDay: number

  // Status
  isActive: boolean
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  /** Total number of insurers matching filters */
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
 * Response from GET /api/insurers
 * Returns paginated list of insurers with metadata
 */
export interface GetInsurersResponse {
  /** Array of insurer summaries */
  insurers: InsurerListItemResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata
}
