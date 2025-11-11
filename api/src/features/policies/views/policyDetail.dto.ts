/**
 * DTO for policy detail view (GET /api/policies/:id)
 */

import type { PolicyStatus } from './viewPolicies.dto.js'

/**
 * Complete policy detail with all fields from Policy table
 * plus minimal references to related entities (id + display name)
 *
 * Follows flat structure pattern for consistency
 */
export interface PolicyDetailResponse {
  // ============================================================================
  // POLICY TABLE - ALL FIELDS
  // ============================================================================

  /** Unique policy ID (CUID) */
  id: string

  /** Policy number (unique business identifier) */
  policyNumber: string

  /** Current policy status */
  status: PolicyStatus

  /** Policy type/category */
  type: string | null

  // Coverage & Copays
  /** Ambulatory copay amount */
  ambCopay: number | null

  /** Hospitalization copay amount */
  hospCopay: number | null

  /** Maternity coverage amount */
  maternity: number | null

  // Premium tiers
  /** Premium for T coverage tier */
  tPremium: number | null

  /** Premium for T+1 coverage tier */
  tplus1Premium: number | null

  /** Premium for T+F (family) coverage tier */
  tplusfPremium: number | null

  // Costs
  /** Tax rate (percentage) */
  taxRate: number | null

  /** Additional costs */
  additionalCosts: number | null

  /** Coverage period start date (YYYY-MM-DD) */
  startDate: string

  /** Coverage period end date (YYYY-MM-DD) */
  endDate: string

  /** Whether policy is active */
  isActive: boolean

  /** When the policy was created */
  createdAt: string

  /** When the policy was last updated */
  updatedAt: string

  // ============================================================================
  // RELATED ENTITIES - FLAT REFERENCES (ID + DISPLAY NAME)
  // ============================================================================

  /** Client ID */
  clientId: string

  /** Client name for display */
  clientName: string

  /** Insurer ID */
  insurerId: string

  /** Insurer name for display */
  insurerName: string
}
