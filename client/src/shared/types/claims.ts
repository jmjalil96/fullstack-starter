/**
 * Claims type definitions
 * Mirrors backend DTOs from api/src/features/claims/new/newClaim.dto.ts
 */

import type { PaginationMetadata } from './common'

// Re-export for convenience
export type { PaginationMetadata }

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
 * Available policy response (for picklist)
 * Returned from GET /api/claims/:claimId/available-policies
 * Mirrors backend: api/src/features/claims/policies/availablePolicies.dto.ts
 */
export interface AvailablePolicyResponse {
  id: string
  policyNumber: string
  type: string | null
  insurerName: string
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
  status: ClaimStatus
  description: string | null

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
 * Terminal states: APPROVED, REJECTED
 * Mirrors backend: api/src/features/claims/views/viewClaims.dto.ts
 */
export type ClaimStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'

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

/**
 * Complete claim detail with all fields
 * Returned from GET /api/claims/:id
 * Mirrors backend: api/src/features/claims/views/claimDetail.dto.ts
 */
export interface ClaimDetailResponse {
  // Claim table - all fields
  id: string
  claimSequence: number
  claimNumber: string
  status: ClaimStatus
  type: string | null
  description: string | null
  amount: number | null
  approvedAmount: number | null
  incidentDate: string | null
  submittedDate: string | null
  resolvedDate: string | null
  createdAt: string
  updatedAt: string

  // Related entities - flat references (id + display name)
  clientId: string
  clientName: string
  affiliateId: string
  affiliateFirstName: string
  affiliateLastName: string
  patientId: string
  patientFirstName: string
  patientLastName: string
  patientRelationship: 'self' | 'dependent'
  policyId: string | null
  policyNumber: string | null
  createdById: string
  createdByName: string | null
}

/**
 * Request body for updating a claim
 * Sent to PUT /api/claims/:id
 * Mirrors backend: api/src/features/claims/edit/claimEdit.dto.ts
 *
 * All fields optional (partial update).
 * Null values clear fields.
 * Only send changed fields (omit undefined).
 */
export interface ClaimUpdateRequest {
  description?: string | null
  amount?: number | null
  approvedAmount?: number | null
  policyId?: string | null
  incidentDate?: string // ISO 8601 date string
  submittedDate?: string // ISO 8601 date string
  resolvedDate?: string // ISO 8601 date string
  type?: string | null
  status?: ClaimStatus
}
