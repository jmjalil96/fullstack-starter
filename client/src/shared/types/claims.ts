/**
 * Claims type definitions
 * Mirrors backend DTOs from api/src/features/claims/new/newClaim.dto.ts
 */

/**
 * Available client response (for picklist)
 * Returned from GET /api/claims/available-clients
 */
export interface AvailableClientResponse {
  id: string
  name: string
}

/**
 * Available affiliate response (for picklist)
 * Returned from GET /api/claims/available-affiliates
 */
export interface AvailableAffiliateResponse {
  id: string
  firstName: string
  lastName: string
  coverageType: string | null
}

/**
 * Available patient response (for picklist)
 * Returned from GET /api/claims/available-patients
 */
export interface AvailablePatientResponse {
  id: string
  firstName: string
  lastName: string
  relationship: 'self' | 'dependent'
}

/**
 * Create claim request body
 * Sent to POST /api/claims
 */
export interface CreateClaimRequest {
  clientId: string
  affiliateId: string
  patientId: string
  description: string
}

/**
 * Create claim response
 * Returned from POST /api/claims
 */
export interface CreateClaimResponse {
  id: string
  claimNumber: string
  status: string
  description: string

  // Client info
  clientId: string
  client: {
    id: string
    name: string
  }

  // Main affiliate (titular)
  affiliateId: string
  affiliate: {
    id: string
    firstName: string
    lastName: string
  }

  // Patient (who received service)
  patientId: string
  patient: {
    id: string
    firstName: string
    lastName: string
  }

  // Fields assigned later by employee
  policyId: string | null
  amount: number | null
  approvedAmount: number | null

  // Metadata
  createdById: string
  submittedDate: string | null // ISO date string
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
}

/**
 * Claim status enum values
 * Mirrors backend: api/src/features/claims/views/viewClaims.dto.ts
 */
export type ClaimStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID'

/**
 * Single claim item in list view
 * Lightweight summary with flat structure (no nested objects)
 * Returned from GET /api/claims
 * Mirrors backend: api/src/features/claims/views/viewClaims.dto.ts
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
 * Pagination metadata
 * Returned from GET /api/claims
 * Mirrors backend: api/src/features/claims/views/viewClaims.dto.ts
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
 * Mirrors backend: api/src/features/claims/views/viewClaims.dto.ts
 */
export interface GetClaimsResponse {
  /** Array of claim summaries */
  claims: ClaimListItemResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata
}
