/**
 * DTOs for viewing/listing clients
 */

/**
 * Query parameters for GET /api/clients
 */
export interface GetClientsQueryParams {
  /** Search by name, taxId, or email (case-insensitive, partial match) */
  search?: string
  /** Filter by active status (undefined = all, true = active only, false = inactive only) */
  isActive?: boolean
  /** Page number (>= 1, default: 1) */
  page?: number
  /** Items per page (1-100, default: 20) */
  limit?: number
}

/**
 * Single client item in list view
 * Flat structure with all Client model fields
 */
export interface ClientListItemResponse {
  // Core identification
  id: string
  name: string

  // Business info
  taxId: string
  email: string | null
  phone: string | null
  address: string | null

  // Status
  isActive: boolean

  // Dates (ISO strings)
  createdAt: string
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  /** Total number of clients matching filters */
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
 * Response from GET /api/clients
 * Returns paginated list of clients with metadata
 */
export interface GetClientsResponse {
  /** Array of client summaries */
  clients: ClientListItemResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata
}
