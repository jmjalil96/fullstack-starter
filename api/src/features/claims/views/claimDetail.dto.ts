/**
 * DTO for claim detail view (GET /api/claims/:id)
 */

import type { CareType, ClaimStatus } from './viewClaims.dto.js'

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
 * Complete claim detail with all fields from Claim table
 * plus minimal references to related entities (id + display name)
 *
 * Follows flat structure pattern for consistency with ClaimListItemResponse
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
