/**
 * DTOs for viewing/listing affiliates
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
 * Query parameters for GET /api/affiliates
 */
export interface GetAffiliatesQueryParams {
  /** Filter by client */
  clientId?: string
  /** Search by first name, last name, document number, or client name (case-insensitive, partial match) */
  search?: string
  /** Filter by affiliate type */
  affiliateType?: AffiliateType
  /** Filter by coverage type */
  coverageType?: CoverageType
  /** Filter by active status (undefined = all, true = active only, false = inactive only) */
  isActive?: boolean
  /** Page number (>= 1, default: 1) */
  page?: number
  /** Items per page (1-100, default: 20) */
  limit?: number
}

/**
 * Single affiliate item in list view
 * Flat structure with all Affiliate model fields plus flattened relations
 */
export interface AffiliateListItemResponse {
  // Core identification
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null

  // Personal info
  dateOfBirth: string | null

  // Document info
  documentType: string | null
  documentNumber: string | null

  // Type & coverage
  affiliateType: AffiliateType
  coverageType: CoverageType | null

  // Client info (flat)
  clientId: string
  clientName: string

  // Family relationship (flat)
  primaryAffiliateId: string | null
  primaryAffiliateFirstName: string | null
  primaryAffiliateLastName: string | null

  // User account
  hasUserAccount: boolean

  // Status
  isActive: boolean

  // Dates (ISO strings)
  createdAt: string
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
 * Response from GET /api/affiliates
 * Returns paginated list of affiliates with metadata
 */
export interface GetAffiliatesResponse {
  /** Array of affiliate summaries */
  affiliates: AffiliateListItemResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata
}
