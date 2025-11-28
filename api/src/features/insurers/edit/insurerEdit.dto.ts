/**
 * DTOs for insurer editing endpoint (PUT /api/insurers/:id)
 *
 * Defines the request and response types for updating insurers.
 * Simple entity - no lifecycle rules, all fields editable anytime.
 */

import type { InsurerDetailResponse } from '../views/insurerDetail.dto.js'

/**
 * Request body for updating an insurer
 *
 * All fields are optional (partial update pattern).
 * Fields marked as nullable can be explicitly set to null to clear them.
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES can edit insurers
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 *
 * Validation:
 * - At least one field must be provided (reject empty updates)
 * - name must be unique if provided
 * - code must be unique if provided
 *
 * @example
 * // Simple update
 * {
 *   "name": "MAPFRE Seguros",
 *   "email": "nuevo@mapfre.com.pe"
 * }
 *
 * @example
 * // Clear optional fields by setting to null
 * {
 *   "code": null,
 *   "phone": null,
 *   "website": null
 * }
 *
 * @example
 * // Deactivate insurer
 * {
 *   "isActive": false
 * }
 */
export interface UpdateInsurerRequest {
  // ============================================================================
  // CORE IDENTIFICATION
  // ============================================================================

  /** Insurer name (must be unique if provided) */
  name?: string

  /** Insurer code (must be unique if provided, can be null to clear) */
  code?: string | null

  // ============================================================================
  // CONTACT INFORMATION
  // ============================================================================

  /** Contact email (can be null to clear) */
  email?: string | null

  /** Contact phone (can be null to clear) */
  phone?: string | null

  /** Website URL (can be null to clear) */
  website?: string | null

  // ============================================================================
  // BILLING CONFIGURATION
  // ============================================================================

  /** Day of month for billing cutoff (1-28) */
  billingCutoffDay?: number

  // ============================================================================
  // STATUS
  // ============================================================================

  /** Whether the insurer is active */
  isActive?: boolean
}

/**
 * Response from PUT /api/insurers/:id
 *
 * Returns complete updated insurer with all fields (same structure as detail view).
 * Client receives full insurer state after update for consistency.
 */
export type UpdateInsurerResponse = InsurerDetailResponse
