/**
 * Affiliates type definitions
 * Mirrors backend DTOs from api/src/features/affiliates/
 */

/**
 * Affiliate type enum values
 * Mirrors: api/src/features/affiliates/views/viewAffiliates.dto.ts
 */
export type AffiliateType = 'OWNER' | 'DEPENDENT'

/**
 * Coverage type enum values
 * Mirrors: api/src/features/affiliates/views/viewAffiliates.dto.ts
 */
export type CoverageType = 'T' | 'TPLUS1' | 'TPLUSF'

/**
 * Available client response (for picklist)
 * Mirrors: api/src/features/affiliates/lookups/clients.dto.ts
 * Returned from GET /api/affiliates/available-clients
 */
export interface AvailableClientResponse {
  id: string
  name: string
}

/**
 * Available owner response (for primary affiliate selection)
 * Mirrors: api/src/features/affiliates/lookups/owners.dto.ts
 * Returned from GET /api/affiliates/available-owners
 */
export interface AvailableOwnerResponse {
  id: string
  firstName: string
  lastName: string
  email: string | null
  documentNumber: string | null
}

/**
 * Single affiliate item in list view
 * Mirrors: api/src/features/affiliates/views/viewAffiliates.dto.ts
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
 * Mirrors: api/src/features/affiliates/views/viewAffiliates.dto.ts
 */
export interface PaginationMetadata {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

/**
 * Response from GET /api/affiliates
 * Mirrors: api/src/features/affiliates/views/viewAffiliates.dto.ts
 */
export interface GetAffiliatesResponse {
  affiliates: AffiliateListItemResponse[]
  pagination: PaginationMetadata
}

/**
 * Complete affiliate detail with all fields
 * Mirrors: api/src/features/affiliates/views/affiliateDetail.dto.ts
 */
export interface AffiliateDetailResponse {
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

  // User account
  hasUserAccount: boolean

  // Status
  isActive: boolean

  // Timestamps (ISO strings)
  createdAt: string
  updatedAt: string

  // Client relationship (flat)
  clientId: string
  clientName: string

  // Primary affiliate relationship (flat)
  primaryAffiliateId: string | null
  primaryAffiliateFirstName: string | null
  primaryAffiliateLastName: string | null
}

/**
 * Create affiliate request body
 * Mirrors: api/src/features/affiliates/new/createAffiliate.dto.ts
 * Sent to POST /api/affiliates
 */
export interface CreateAffiliateRequest {
  clientId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth?: string
  documentType?: string
  documentNumber?: string
  affiliateType: AffiliateType
  coverageType?: CoverageType
  primaryAffiliateId?: string
}

/**
 * Create affiliate response
 * Mirrors: api/src/features/affiliates/new/createAffiliate.dto.ts
 * Returned from POST /api/affiliates
 */
export interface CreateAffiliateResponse {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  dateOfBirth: string | null
  documentType: string | null
  documentNumber: string | null
  affiliateType: AffiliateType
  coverageType: CoverageType | null
  clientId: string
  clientName: string
  primaryAffiliateId: string | null
  primaryAffiliateFirstName: string | null
  primaryAffiliateLastName: string | null
  hasUserAccount: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Update affiliate request body
 * Mirrors: api/src/features/affiliates/edit/affiliateEdit.dto.ts
 * Sent to PUT /api/affiliates/:id
 */
export interface UpdateAffiliateRequest {
  firstName?: string
  lastName?: string
  email?: string | null
  phone?: string | null
  dateOfBirth?: string | null
  documentType?: string | null
  documentNumber?: string | null
  affiliateType?: AffiliateType
  coverageType?: CoverageType | null
  primaryAffiliateId?: string | null
  isActive?: boolean
}

/**
 * Update affiliate response (same as detail response)
 * Mirrors: api/src/features/affiliates/edit/affiliateEdit.dto.ts
 * Returned from PUT /api/affiliates/:id
 */
export type UpdateAffiliateResponse = AffiliateDetailResponse
