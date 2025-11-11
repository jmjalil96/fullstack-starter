/**
 * Policies type definitions
 * Mirrors backend DTOs from api/src/features/policies/
 */

/**
 * Policy status enum values
 * Mirrors: api/src/features/policies/views/viewPolicies.dto.ts
 */
export type PolicyStatus = 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED'

/**
 * Available client response (for picklist)
 * Mirrors: api/src/features/policies/lookups/clients.dto.ts
 * Returned from GET /api/policies/available-clients
 */
export interface AvailableClientResponse {
  id: string
  name: string
}

/**
 * Available insurer response (for picklist)
 * Mirrors: api/src/features/policies/lookups/insurers.dto.ts
 * Returned from GET /api/policies/available-insurers
 */
export interface AvailableInsurerResponse {
  id: string
  name: string
  code: string | null
}

/**
 * Single policy item in list view
 * Mirrors: api/src/features/policies/views/viewPolicies.dto.ts
 */
export interface PolicyListItemResponse {
  // Core identification
  id: string
  policyNumber: string
  status: PolicyStatus
  type: string | null

  // Client info (flat)
  clientId: string
  clientName: string

  // Insurer info (flat)
  insurerId: string
  insurerName: string

  // Coverage period (date-only strings YYYY-MM-DD)
  startDate: string
  endDate: string

  // Status
  isActive: boolean

  // Dates (ISO strings)
  createdAt: string
}

/**
 * Pagination metadata
 * Mirrors: api/src/features/policies/views/viewPolicies.dto.ts
 */
export interface PaginationMetadata {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

/**
 * Response from GET /api/policies
 * Mirrors: api/src/features/policies/views/viewPolicies.dto.ts
 */
export interface GetPoliciesResponse {
  policies: PolicyListItemResponse[]
  pagination: PaginationMetadata
}

/**
 * Complete policy detail with all fields
 * Mirrors: api/src/features/policies/views/policyDetail.dto.ts
 */
export interface PolicyDetailResponse {
  // Policy table - all fields
  id: string
  policyNumber: string
  status: PolicyStatus
  type: string | null

  // Coverage & Copays
  ambCopay: number | null
  hospCopay: number | null
  maternity: number | null

  // Premium tiers
  tPremium: number | null
  tplus1Premium: number | null
  tplusfPremium: number | null

  // Costs
  taxRate: number | null
  additionalCosts: number | null

  // Coverage period (date-only strings YYYY-MM-DD)
  startDate: string
  endDate: string

  // Status
  isActive: boolean

  // Timestamps (ISO strings)
  createdAt: string
  updatedAt: string

  // Related entities (flat)
  clientId: string
  clientName: string
  insurerId: string
  insurerName: string
}

/**
 * Create policy request body
 * Mirrors: api/src/features/policies/new/createPolicy.dto.ts
 * Sent to POST /api/policies
 */
export interface CreatePolicyRequest {
  policyNumber: string
  clientId: string
  insurerId: string
  type?: string
  startDate: string
  endDate: string
}

/**
 * Create policy response
 * Mirrors: api/src/features/policies/new/createPolicy.dto.ts
 * Returned from POST /api/policies
 */
export interface CreatePolicyResponse {
  id: string
  policyNumber: string
  status: PolicyStatus
  type: string | null

  clientId: string
  clientName: string

  insurerId: string
  insurerName: string

  startDate: string
  endDate: string

  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Update policy request body
 * Mirrors: api/src/features/policies/edit/policyEdit.dto.ts
 * Sent to PUT /api/policies/:id
 */
export interface UpdatePolicyRequest {
  // Structural fields
  policyNumber?: string
  clientId?: string
  insurerId?: string

  // Nullable fields
  type?: string | null
  ambCopay?: number | null
  hospCopay?: number | null
  maternity?: number | null
  tPremium?: number | null
  tplus1Premium?: number | null
  tplusfPremium?: number | null
  taxRate?: number | null
  additionalCosts?: number | null

  // Dates
  startDate?: string
  endDate?: string

  // Status
  status?: PolicyStatus
}

/**
 * Update policy response (same as detail response)
 * Mirrors: api/src/features/policies/edit/policyEdit.dto.ts
 * Returned from PUT /api/policies/:id
 */
export type UpdatePolicyResponse = PolicyDetailResponse
