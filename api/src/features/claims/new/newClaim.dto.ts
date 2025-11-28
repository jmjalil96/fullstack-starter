/**
 * DTOs for new claim endpoint
 */

import type { CareType, ClaimStatus } from '../views/viewClaims.dto.js'

// Pending file input - files uploaded before claim exists
export interface PendingFileInput {
  storageKey: string
  originalName: string
  fileSize: number
  mimeType: string
  category?: string
}

// Request DTO - What client sends
export interface CreateClaimRequest {
  clientId: string
  affiliateId: string
  patientId: string
  description?: string
  careType?: CareType
  diagnosisCode?: string
  diagnosisDescription?: string
  amountSubmitted?: number
  incidentDate?: string
  submittedDate?: string
  pendingFiles?: PendingFileInput[]
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

// Response DTO - What API returns (flat structure)
export interface CreateClaimResponse {
  id: string
  claimNumber: string
  status: ClaimStatus
  description: string | null

  // Diagnosis info
  careType: CareType | null
  diagnosisCode: string | null
  diagnosisDescription: string | null

  // Financial fields
  amountSubmitted: number | null

  // Dates
  incidentDate: string | null
  submittedDate: string | null

  // Client info (flat)
  clientId: string
  clientName: string

  // Main affiliate - titular (flat)
  affiliateId: string
  affiliateFirstName: string
  affiliateLastName: string

  // Patient - who received service (flat)
  patientId: string
  patientFirstName: string
  patientLastName: string

  // Fields assigned later
  policyId: string | null

  // Metadata
  createdById: string
  createdAt: string
  updatedAt: string
}
