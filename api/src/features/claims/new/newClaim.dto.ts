/**
 * DTOs for new claim endpoint
 */

// Request DTO - What client sends
export interface CreateClaimRequest {
  clientId: string
  affiliateId: string
  patientId: string
  description: string
}

// Available clients response (for picklist)
export interface AvailableClientResponse {
  id: string
  name: string
}

// Available affiliates response (for picklist)
export interface AvailableAffiliateResponse {
  id: string
  firstName: string
  lastName: string
  coverageType: string | null
}

// Available patients response (for picklist)
export interface AvailablePatientResponse {
  id: string
  firstName: string
  lastName: string
  relationship: 'self' | 'dependent'
}

// Response DTO - What API returns
export interface CreateClaimResponse {
  id: string
  claimNumber: string
  status: string
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
  createdAt: string            // ISO date string
  updatedAt: string            // ISO date string
}
