/**
 * DTOs for claim editing endpoint (PUT /api/claims/:id)
 *
 * Defines the request and response types for updating claims.
 * Actual field editability depends on current claim status (see lifecycle blueprint).
 */

import type { ClaimLifecycleState } from '../shared/claimLifecycle.blueprint.js'
import type { ClaimDetailResponse } from '../views/claimDetail.dto.js'
import type { CareType } from '../views/viewClaims.dto.js'

/**
 * Request body for updating a claim
 *
 * All fields are optional (partial update pattern).
 * Fields marked as nullable can be explicitly set to null to clear them.
 *
 * Field editability varies by claim status:
 * - DRAFT: careType, diagnosisCode, diagnosisDescription, amountSubmitted, incidentDate, submittedDate, description, policyId
 * - VALIDATION: (same as DRAFT for corrections)
 * - SUBMITTED: businessDays only
 * - PENDING_INFO: (all DRAFT fields + businessDays)
 * - RETURNED/SETTLED/CANCELLED: No fields editable (terminal states, SUPER_ADMIN only)
 *
 * Status transition workflow (STRICT - enforced by validator):
 * - Only fields editable in CURRENT status can be sent in update request
 * - When changing status, use 2-step workflow:
 *   1. Transition status + send fields editable in current status
 *   2. After status changed, send fields editable in new status
 *
 * Special transitions:
 * - PENDING_INFO → SUBMITTED: Must provide reprocessDate + reprocessDescription
 *   (These create a ClaimReprocess record)
 * - SUBMITTED → SETTLED: Must provide all settlement fields
 *
 * Date format:
 * - All date fields expect ISO 8601 strings (e.g., "2025-01-15")
 * - Validation/parsing handled by Zod schema layer
 */
export interface ClaimUpdateRequest {
  // ============================================================================
  // BASIC FIELDS (editable in DRAFT, VALIDATION, PENDING_INFO)
  // ============================================================================

  /** Claim description/narrative (3-5000 chars) */
  description?: string | null

  /** Type of care (Ambulatory, Hospitalization, etc.) */
  careType?: CareType | null

  /** ICD diagnosis code */
  diagnosisCode?: string | null

  /** Diagnosis description text */
  diagnosisDescription?: string | null

  /** Total amount submitted for reimbursement */
  amountSubmitted?: number | null

  /** When the incident occurred (ISO date string) */
  incidentDate?: string

  /** When the claim was submitted to insurer (ISO date string) */
  submittedDate?: string

  /** Policy ID covering this claim (can be null to clear) */
  policyId?: string | null

  // ============================================================================
  // TRACKING FIELDS (editable in SUBMITTED, PENDING_INFO)
  // ============================================================================

  /** Business days tracking */
  businessDays?: number | null

  // ============================================================================
  // SETTLEMENT FIELDS (required for SUBMITTED → SETTLED transition)
  // ============================================================================

  /** Gastos No Elegibles - amount denied by insurer */
  amountDenied?: number | null

  /** Gastos No Procesados - unprocessed amount */
  amountUnprocessed?: number | null

  /** Aplicación de Deducible - deductible applied */
  deductibleApplied?: number | null

  /** Copago - copay applied */
  copayApplied?: number | null

  /** Fecha de Liquidación - settlement date (ISO date string) */
  settlementDate?: string

  /** Número de Liquidación - settlement number from insurer */
  settlementNumber?: string | null

  /** Observaciones - settlement notes */
  settlementNotes?: string | null

  /** Liquidado - approved amount (calculated or entered) */
  amountApproved?: number | null

  // ============================================================================
  // REPROCESS FIELDS (required for PENDING_INFO → SUBMITTED transition)
  // ============================================================================

  /** Date when claim was reprocessed (ISO date string) */
  reprocessDate?: string

  /** Description of why reprocessing was needed */
  reprocessDescription?: string

  // ============================================================================
  // STATUS TRANSITION
  // ============================================================================

  /**
   * New claim status (triggers lifecycle validation)
   * Valid values: DRAFT, PENDING_INFO, VALIDATION, SUBMITTED, RETURNED, SETTLED, CANCELLED
   * Transitions validated against blueprint rules
   */
  status?: ClaimLifecycleState
}

/**
 * Response from PUT /api/claims/:id
 *
 * Returns complete updated claim with all fields (same structure as detail view).
 * Client receives full claim state after update for consistency.
 */
export type ClaimUpdateResponse = ClaimDetailResponse
