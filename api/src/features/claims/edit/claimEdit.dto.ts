/**
 * DTOs for claim editing endpoint (PUT /api/claims/:id)
 *
 * Defines the request and response types for updating claims.
 * Actual field editability depends on current claim status (see lifecycle blueprint).
 */

import type { ClaimLifecycleState } from '../shared/claimLifecycle.blueprint.js'
import type { ClaimDetailResponse } from '../views/claimDetail.dto.js'

/**
 * Request body for updating a claim
 *
 * All fields are optional (partial update pattern).
 * Fields marked as nullable can be explicitly set to null to clear them.
 *
 * Field editability varies by claim status:
 * - SUBMITTED: description, amount, policyId, incidentDate, type, submittedDate
 * - UNDER_REVIEW: approvedAmount, resolvedDate
 * - APPROVED/REJECTED: No fields editable (terminal states, SUPER_ADMIN only)
 *
 * Status transition workflow (STRICT - enforced by validator):
 * - Only fields editable in CURRENT status can be sent in update request
 * - When changing status, use 2-step workflow:
 *   1. Transition status + send fields editable in current status
 *   2. After status changed, send fields editable in new status
 * - This enforces clear separation between transition and data entry
 *
 * Status transitions trigger lifecycle validation:
 * - SUBMITTED → UNDER_REVIEW (requires all base fields)
 * - UNDER_REVIEW → APPROVED/REJECTED (requires approvedAmount + resolvedDate)
 *
 * Date format:
 * - All date fields expect ISO 8601 strings (e.g., "2025-01-15T10:30:00.000Z")
 * - Validation/parsing handled by Zod schema layer
 *
 * @example
 * // Simple update (edit fields in current status)
 * {
 *   "description": "Updated claim description",
 *   "amount": 150.50
 * }
 *
 * @example
 * // Step 1: Transition from SUBMITTED to UNDER_REVIEW
 * // (can only send SUBMITTED-editable fields + status)
 * {
 *   "status": "UNDER_REVIEW",
 *   "policyId": "xyz123",
 *   "description": "Final description before review"
 * }
 *
 * @example
 * // Step 2: Set approval decision (after status is UNDER_REVIEW)
 * // (now can send UNDER_REVIEW-editable fields)
 * {
 *   "approvedAmount": 100.00,
 *   "resolvedDate": "2025-11-07T12:00:00.000Z"
 * }
 *
 * @example
 * // Clear optional field by setting to null
 * {
 *   "type": null,
 *   "amount": null
 * }
 */
export interface ClaimUpdateRequest {
  /** Claim description/narrative (3-5000 chars) */
  description?: string | null

  /** Claimed amount (can be null to clear) */
  amount?: number | null

  /** Approved amount after review (can be null to clear) */
  approvedAmount?: number | null

  /** Policy ID covering this claim (can be null to clear) */
  policyId?: string | null

  /** When the incident occurred (ISO 8601 date string) */
  incidentDate?: string

  /** When the claim was submitted (ISO 8601 date string, manual entry) */
  submittedDate?: string

  /** When the claim was resolved (ISO 8601 date string) */
  resolvedDate?: string

  /** Claim type/category (can be null to clear) */
  type?: string | null

  /**
   * New claim status (triggers lifecycle validation)
   * Valid values: SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED
   * Transitions validated against blueprint rules
   */
  status?: ClaimLifecycleState
}

/**
 * Response from PUT /api/claims/:id
 *
 * Returns complete updated claim with all fields (same structure as detail view).
 * Client receives full claim state after update for consistency.
 *
 * @example
 * {
 *   "id": "abc123",
 *   "claimNumber": "RECL_XXXXXXX",
 *   "status": "UNDER_REVIEW",
 *   "description": "Updated description",
 *   "amount": 150.50,
 *   "approvedAmount": 100.00,
 *   "clientName": "TechCorp S.A.",
 *   "affiliateFirstName": "Juan",
 *   "affiliateLastName": "Pérez",
 *   ...all other ClaimDetailResponse fields
 * }
 */
export type ClaimUpdateResponse = ClaimDetailResponse
