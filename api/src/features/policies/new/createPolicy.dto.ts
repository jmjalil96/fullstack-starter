/**
 * DTOs for creating policies
 */

/**
 * Request DTO - What client sends
 */
export interface CreatePolicyRequest {
  /** Policy number (unique business identifier) */
  policyNumber: string

  /** Client ID (company this policy is for) */
  clientId: string

  /** Insurer ID (insurance carrier) */
  insurerId: string

  /** Policy type/category (optional) */
  type?: string

  /** Coverage period start date */
  startDate: string // Will be Date object after Zod coercion

  /** Coverage period end date */
  endDate: string // Will be Date object after Zod coercion
}

/**
 * Response DTO - What API returns after creation
 */
export interface CreatePolicyResponse {
  id: string
  policyNumber: string
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED'
  type: string | null

  clientId: string
  clientName: string

  insurerId: string
  insurerName: string

  startDate: string // "2024-01-01" format
  endDate: string

  isActive: boolean
  createdAt: string
  updatedAt: string
}
