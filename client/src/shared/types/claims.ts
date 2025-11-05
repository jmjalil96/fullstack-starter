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
