/**
 * Claims type definitions
 * Mirrors backend DTOs from api/src/features/claims/
 */

import type { PaginationMetadata } from '../../shared/types/common'

// Re-export for convenience
export type { PaginationMetadata }

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Claim status enum values (7-status workflow)
 * Terminal states: RETURNED, SETTLED, CANCELLED
 */
export type ClaimStatus =
  | 'DRAFT'
  | 'PENDING_INFO'
  | 'VALIDATION'
  | 'SUBMITTED'
  | 'RETURNED'
  | 'SETTLED'
  | 'CANCELLED'

/**
 * Care type enum values
 */
export type CareType = 'AMBULATORY' | 'HOSPITALIZATION' | 'MATERNITY' | 'EMERGENCY' | 'OTHER'

// ============================================================================
// LOOKUP/PICKLIST RESPONSES
// ============================================================================

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
 */
export interface AvailablePolicyResponse {
  id: string
  policyNumber: string
  type: string | null
  insurerName: string
}

// ============================================================================
// CREATE CLAIM
// ============================================================================

/**
 * Pending file input - files uploaded before claim exists
 */
export interface PendingFileInput {
  storageKey: string
  originalName: string
  fileSize: number
  mimeType: string
  category?: string
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
  pendingFiles?: PendingFileInput[]
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

  // Metadata
  createdById: string
  submittedDate: string | null // ISO date string
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
}

// ============================================================================
// LIST VIEW
// ============================================================================

/**
 * Single claim item in list view
 * Lightweight summary with flat structure (no nested objects)
 * Returned from GET /api/claims
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

  // Diagnosis info
  careType: CareType | null

  // Financial data
  amountSubmitted: number | null
  amountApproved: number | null

  // Dates (ISO strings)
  submittedDate: string | null
  settlementDate: string | null
  createdAt: string
}

/**
 * Response from GET /api/claims
 * Returns paginated list of claims with metadata
 */
export interface GetClaimsResponse {
  /** Array of claim summaries */
  claims: ClaimListItemResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata
}

// ============================================================================
// DETAIL VIEW
// ============================================================================

/**
 * Claim invoice item in detail response
 */
export interface ClaimInvoiceItem {
  /** Unique invoice ID (CUID) */
  id: string
  /** Invoice number from provider */
  invoiceNumber: string
  /** Medical provider name */
  providerName: string
  /** Amount submitted for this invoice */
  amountSubmitted: number
  /** Name of user who added this invoice */
  createdByName: string | null
  /** When the invoice was added (ISO string) */
  createdAt: string
}

/**
 * Claim reprocess item in detail response
 */
export interface ClaimReprocessItem {
  /** Unique reprocess ID (CUID) */
  id: string
  /** Date of reprocess (ISO date string) */
  reprocessDate: string
  /** Why reprocessing was needed */
  reprocessDescription: string
  /** Business days for this reprocess cycle */
  businessDays: number | null
  /** Name of user who created record */
  createdByName: string | null
  /** When the record was created (ISO string) */
  createdAt: string
}

/**
 * Complete claim detail with all fields
 * Returned from GET /api/claims/:id
 */
export interface ClaimDetailResponse {
  // ============================================================================
  // CLAIM TABLE - ALL FIELDS
  // ============================================================================

  /** Unique claim ID (CUID) */
  id: string

  /** Sequential number from PostgreSQL sequence */
  claimSequence: number

  /** Human-readable claim number (RECL_XXXXXXXX format) */
  claimNumber: string

  /** Current claim status */
  status: ClaimStatus

  /** Detailed description of the claim */
  description: string | null

  // ============================================================================
  // DIAGNOSIS INFORMATION
  // ============================================================================

  /** Type of care (Ambulatory, Hospitalization, etc.) */
  careType: CareType | null

  /** ICD diagnosis code */
  diagnosisCode: string | null

  /** Diagnosis description text */
  diagnosisDescription: string | null

  // ============================================================================
  // FINANCIAL FIELDS
  // ============================================================================

  /** Total valor presentado - amount submitted */
  amountSubmitted: number | null

  /** Liquidado - approved amount */
  amountApproved: number | null

  /** Gastos No Elegibles - denied amount */
  amountDenied: number | null

  /** Gastos No Procesados - unprocessed amount */
  amountUnprocessed: number | null

  /** Aplicación de Deducible - deductible applied */
  deductibleApplied: number | null

  /** Copago - copay applied */
  copayApplied: number | null

  // ============================================================================
  // DATE FIELDS
  // ============================================================================

  /** Fecha de Incurrencia - when the incident occurred */
  incidentDate: string | null

  /** Fecha de Presentación - when the claim was submitted */
  submittedDate: string | null

  /** Fecha de Liquidación - when the claim was settled */
  settlementDate: string | null

  /** When the claim was created */
  createdAt: string

  /** When the claim was last updated */
  updatedAt: string

  // ============================================================================
  // SETTLEMENT FIELDS
  // ============================================================================

  /** Días Laborables - business days tracking */
  businessDays: number | null

  /** Número de Liquidación - settlement number */
  settlementNumber: string | null

  /** Observaciones - settlement notes */
  settlementNotes: string | null

  // ============================================================================
  // RELATED ENTITIES - FLAT REFERENCES (ID + DISPLAY NAME)
  // ============================================================================

  /** Client ID */
  clientId: string

  /** Client name for display */
  clientName: string

  /** Affiliate ID (main owner who submitted the claim) */
  affiliateId: string

  /** Affiliate first name */
  affiliateFirstName: string

  /** Affiliate last name */
  affiliateLastName: string

  /** Patient ID (who received treatment - can be affiliate or dependent) */
  patientId: string

  /** Patient first name */
  patientFirstName: string

  /** Patient last name */
  patientLastName: string

  /** Relationship of patient to affiliate */
  patientRelationship: 'self' | 'dependent'

  /** Policy ID (optional - currently not assigned at creation) */
  policyId: string | null

  /** Policy number for display (optional) */
  policyNumber: string | null

  /** ID of user who created the claim */
  createdById: string

  /** Name of user who created the claim (optional) */
  createdByName: string | null

  /** ID of user who last updated the claim */
  updatedById: string | null

  /** Name of user who last updated the claim (optional) */
  updatedByName: string | null

  // ============================================================================
  // RELATED COLLECTIONS
  // ============================================================================

  /** Invoices/receipts submitted for this claim */
  invoices: ClaimInvoiceItem[]

  /** Reprocess records for this claim */
  reprocesses: ClaimReprocessItem[]
}

// ============================================================================
// UPDATE CLAIM
// ============================================================================

/**
 * Request body for updating a claim
 * Sent to PUT /api/claims/:id
 *
 * All fields optional (partial update).
 * Null values clear fields.
 * Only send changed fields (omit undefined).
 */
export interface ClaimUpdateRequest {
  // Basic fields (editable in DRAFT, VALIDATION, PENDING_INFO)
  description?: string | null
  careType?: CareType | null
  diagnosisCode?: string | null
  diagnosisDescription?: string | null
  amountSubmitted?: number | null
  incidentDate?: string // ISO 8601 date string
  submittedDate?: string // ISO 8601 date string
  policyId?: string | null

  // Tracking fields (editable in SUBMITTED, PENDING_INFO)
  businessDays?: number | null

  // Settlement fields (required for SUBMITTED → SETTLED transition)
  amountApproved?: number | null
  amountDenied?: number | null
  amountUnprocessed?: number | null
  deductibleApplied?: number | null
  copayApplied?: number | null
  settlementDate?: string // ISO 8601 date string
  settlementNumber?: string | null
  settlementNotes?: string | null

  // Reprocess fields (required for PENDING_INFO → SUBMITTED transition)
  reprocessDate?: string // ISO 8601 date string
  reprocessDescription?: string

  // Status transition
  status?: ClaimStatus
}
