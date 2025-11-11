/**
 * DTOs for policy editing endpoint (PUT /api/policies/:id)
 *
 * Defines the request and response types for updating policies.
 * Actual field editability depends on current policy status (see lifecycle blueprint).
 */

import type { PolicyLifecycleState } from '../shared/policyLifecycle.blueprint.js'
import type { PolicyDetailResponse } from '../views/policyDetail.dto.js'

/**
 * Request body for updating a policy
 *
 * All fields are optional (partial update pattern).
 * Fields marked as nullable can be explicitly set to null to clear them.
 *
 * Field editability varies by policy status:
 * - PENDING: All 14 fields editable (BROKER_EMPLOYEES)
 * - ACTIVE: All 14 fields editable (SUPER_ADMIN only)
 * - EXPIRED: All 14 fields editable (SUPER_ADMIN only)
 * - CANCELLED: All 14 fields editable (SUPER_ADMIN only)
 *
 * Status transition workflow (enforced by validator):
 * - PENDING → ACTIVE (requires all 14 fields filled)
 * - ACTIVE → EXPIRED or CANCELLED (no requirements)
 * - EXPIRED → ACTIVE (requires all 14 fields filled) or CANCELLED (no requirements)
 * - CANCELLED → None (terminal state)
 *
 * Date format:
 * - All date fields expect ISO 8601 strings (e.g., "2025-01-15")
 * - Validation/parsing handled by Zod schema layer
 *
 * @example
 * // Simple update (edit fields in PENDING)
 * {
 *   "type": "Dental",
 *   "ambCopay": 25.00,
 *   "tPremium": 50.00
 * }
 *
 * @example
 * // Transition from PENDING to ACTIVE (all fields must be filled)
 * {
 *   "status": "ACTIVE",
 *   "type": "Salud",
 *   "ambCopay": 25,
 *   "hospCopay": 50,
 *   "maternity": 100,
 *   "tPremium": 50,
 *   "tplus1Premium": 80,
 *   "tplusfPremium": 120,
 *   "taxRate": 0.18,
 *   "additionalCosts": 5
 * }
 *
 * @example
 * // Clear optional field by setting to null
 * {
 *   "type": null,
 *   "additionalCosts": null
 * }
 */
export interface PolicyUpdateRequest {
  /** Policy number (unique identifier, uppercased) */
  policyNumber?: string

  /** Client ID (company this policy is for) */
  clientId?: string

  /** Insurer ID (insurance carrier) */
  insurerId?: string

  /** Policy type/category (can be null to clear) */
  type?: string | null

  /** Ambulatory copay amount (can be null to clear) */
  ambCopay?: number | null

  /** Hospitalization copay amount (can be null to clear) */
  hospCopay?: number | null

  /** Maternity coverage amount (can be null to clear) */
  maternity?: number | null

  /** Premium for T coverage tier (can be null to clear) */
  tPremium?: number | null

  /** Premium for T+1 coverage tier (can be null to clear) */
  tplus1Premium?: number | null

  /** Premium for T+F (family) coverage tier (can be null to clear) */
  tplusfPremium?: number | null

  /** Tax rate as decimal 0-1 (can be null to clear) */
  taxRate?: number | null

  /** Additional costs (can be null to clear) */
  additionalCosts?: number | null

  /** Coverage period start date (ISO 8601 date string) */
  startDate?: string

  /** Coverage period end date (ISO 8601 date string) */
  endDate?: string

  /**
   * New policy status (triggers lifecycle validation)
   * Valid values: PENDING, ACTIVE, EXPIRED, CANCELLED
   * Transitions validated against blueprint rules
   */
  status?: PolicyLifecycleState
}

/**
 * Response from PUT /api/policies/:id
 *
 * Returns complete updated policy with all fields (same structure as detail view).
 * Client receives full policy state after update for consistency.
 *
 * @example
 * {
 *   "id": "abc123",
 *   "policyNumber": "POL-TEST-001",
 *   "status": "ACTIVE",
 *   "type": "Salud",
 *   "clientName": "TechCorp S.A.",
 *   "insurerName": "MAPFRE",
 *   "ambCopay": 25,
 *   "tPremium": 50,
 *   ...all other PolicyDetailResponse fields
 * }
 */
export type PolicyUpdateResponse = PolicyDetailResponse
