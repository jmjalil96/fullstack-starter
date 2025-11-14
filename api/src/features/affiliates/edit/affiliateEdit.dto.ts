/**
 * DTOs for affiliate editing endpoint (PUT /api/affiliates/:id)
 *
 * Defines the request and response types for updating affiliates.
 * Similar to clients - no lifecycle rules, all fields editable anytime.
 */

import type { AffiliateDetailResponse } from '../views/affiliateDetail.dto.js'

/**
 * Request body for updating an affiliate
 *
 * All fields are optional (partial update pattern).
 * Fields marked as nullable can be explicitly set to null to clear them.
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES can edit affiliates
 * - CLIENT_ADMIN and AFFILIATE have read-only access
 *
 * Validation:
 * - At least one field must be provided (reject empty updates)
 * - If affiliateType changes to DEPENDENT, primaryAffiliateId must be provided
 * - If affiliateType is OWNER, primaryAffiliateId must be null
 * - dateOfBirth will be coerced to Date by Zod validation
 *
 * @example
 * // Simple update
 * {
 *   "firstName": "Juan",
 *   "lastName": "Pérez",
 *   "email": "juan.perez@example.com"
 * }
 *
 * @example
 * // Clear optional fields by setting to null
 * {
 *   "phone": null,
 *   "email": null,
 *   "documentType": null,
 *   "documentNumber": null
 * }
 *
 * @example
 * // Change affiliate type from OWNER to DEPENDENT
 * {
 *   "affiliateType": "DEPENDENT",
 *   "primaryAffiliateId": "clxxx123",
 *   "coverageType": "TPLUS1"
 * }
 *
 * @example
 * // Deactivate affiliate
 * {
 *   "isActive": false
 * }
 */
export interface UpdateAffiliateRequest {
  // ============================================================================
  // CORE IDENTIFICATION
  // ============================================================================

  /** First name (nombre) */
  firstName?: string

  /** Last name (apellido) */
  lastName?: string

  // ============================================================================
  // PERSONAL INFORMATION
  // ============================================================================

  /** Contact email (can be null to clear) */
  email?: string | null

  /** Contact phone (can be null to clear) */
  phone?: string | null

  /** Date of birth in ISO format YYYY-MM-DD (can be null to clear, will be coerced to Date) */
  dateOfBirth?: string | null

  /** Document type - e.g., CI, RUC, Passport (can be null to clear) */
  documentType?: string | null

  /** Document number (can be null to clear) */
  documentNumber?: string | null

  // ============================================================================
  // CLASSIFICATION
  // ============================================================================

  /** Type of affiliate - owner (titular) or dependent (dependiente) */
  affiliateType?: 'OWNER' | 'DEPENDENT'

  /** Coverage type - T (titular), TPLUS1 (titular + 1), TPLUSF (titular + family) (can be null to clear) */
  coverageType?: 'T' | 'TPLUS1' | 'TPLUSF' | null

  /** Primary affiliate ID - required if affiliateType is DEPENDENT, must be null if OWNER (can be null to clear) */
  primaryAffiliateId?: string | null

  // ============================================================================
  // STATUS
  // ============================================================================

  /** Whether the affiliate is active */
  isActive?: boolean
}

/**
 * Response from PUT /api/affiliates/:id
 *
 * Returns complete updated affiliate with all fields (same structure as detail view).
 * Client receives full affiliate state after update for consistency.
 */
export type UpdateAffiliateResponse = AffiliateDetailResponse
