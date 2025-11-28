/**
 * Policies API service layer
 * Type-safe wrappers around fetchAPI for policies endpoints
 */

import { fetchAPI } from '../../config/api'
import type { AffiliateType } from '../affiliates/affiliates'

import type {
  AvailableClientResponse,
  AvailableInsurerResponse,
  CreatePolicyRequest,
  CreatePolicyResponse,
  GetPoliciesResponse,
  PolicyDetailResponse,
  PolicyStatus,
  UpdatePolicyRequest,
  UpdatePolicyResponse,
  GetPolicyAffiliatesResponse,
  AddAffiliateToPolicyRequest,
  AddAffiliateToPolicyResponse,
  RemoveAffiliateFromPolicyRequest,
  RemoveAffiliateFromPolicyResponse,
} from './policies'

/**
 * Get available clients for policy creation
 *
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Array of active clients
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const clients = await getAvailableClients()
 * // Returns: [{ id: '...', name: 'TechCorp' }, ...]
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const clients = await getAvailableClients({ signal: controller.signal })
 */
export async function getAvailableClients(
  options?: RequestInit
): Promise<AvailableClientResponse[]> {
  return fetchAPI<AvailableClientResponse[]>('/api/policies/available-clients', options)
}

/**
 * Get available insurers for policy creation
 *
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Array of active insurers with codes
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const insurers = await getAvailableInsurers()
 * // Returns: [{ id: '...', name: 'MAPFRE', code: 'MAPFRE' }, ...]
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const insurers = await getAvailableInsurers({ signal: controller.signal })
 */
export async function getAvailableInsurers(
  options?: RequestInit
): Promise<AvailableInsurerResponse[]> {
  return fetchAPI<AvailableInsurerResponse[]>('/api/policies/available-insurers', options)
}

/**
 * Create a new policy
 *
 * Creates policy with status PENDING. All copays/premiums/costs
 * can be set during creation or filled later before activation.
 *
 * @param data - Policy data (policyNumber, client, insurer, dates, optional type)
 * @returns Created policy with PENDING status
 * @throws {ApiRequestError} If request fails (400, 403, 404, 409)
 *
 * @example
 * const policy = await createPolicy({
 *   policyNumber: 'POL-TEST-001',
 *   clientId: 'client-123',
 *   insurerId: 'insurer-456',
 *   type: 'Salud',
 *   startDate: '2025-01-01',
 *   endDate: '2025-12-31'
 * })
 * // Returns: { id: '...', policyNumber: 'POL-TEST-001', status: 'PENDING', ... }
 */
export async function createPolicy(data: CreatePolicyRequest): Promise<CreatePolicyResponse> {
  return fetchAPI<CreatePolicyResponse>('/api/policies', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Get paginated list of policies with optional filters
 *
 * Returns policies based on user's role and permissions.
 * Backend applies defaults: page=1, limit=20
 *
 * @param params - Optional query parameters for filtering and pagination
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Paginated policies list with metadata
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * // Get first page with defaults
 * const response = await getPolicies()
 * // Returns: { policies: [...], pagination: { total, page: 1, limit: 20, ... } }
 *
 * @example
 * // Filter by status
 * const response = await getPolicies({ status: 'ACTIVE' })
 *
 * @example
 * // Filter by client
 * const response = await getPolicies({ clientId: 'client-123' })
 *
 * @example
 * // Filter by insurer
 * const response = await getPolicies({ insurerId: 'insurer-456' })
 *
 * @example
 * // Search by policy number
 * const response = await getPolicies({ search: 'POL-TEST-001' })
 *
 * @example
 * // With pagination
 * const response = await getPolicies({ page: 2, limit: 10 })
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const response = await getPolicies({ page: 1 }, { signal: controller.signal })
 */
export async function getPolicies(
  params?: {
    status?: PolicyStatus
    clientId?: string
    insurerId?: string
    search?: string
    page?: number
    limit?: number
  },
  options?: RequestInit
): Promise<GetPoliciesResponse> {
  // Build query string from params
  const searchParams = new URLSearchParams()

  if (params?.status) {
    searchParams.append('status', params.status)
  }
  if (params?.clientId) {
    searchParams.append('clientId', params.clientId)
  }
  if (params?.insurerId) {
    searchParams.append('insurerId', params.insurerId)
  }
  if (params?.search) {
    searchParams.append('search', params.search)
  }
  if (params?.page !== undefined) {
    searchParams.append('page', params.page.toString())
  }
  if (params?.limit !== undefined) {
    searchParams.append('limit', params.limit.toString())
  }

  const queryString = searchParams.toString()
  const endpoint = `/api/policies${queryString ? `?${queryString}` : ''}`

  return fetchAPI<GetPoliciesResponse>(endpoint, options)
}

/**
 * Get complete policy detail by ID
 *
 * @param policyId - Policy ID to fetch (CUID)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Complete policy with all fields and related entities
 * @throws {ApiRequestError} If request fails (404 if not found or no access)
 *
 * @example
 * const policy = await getPolicyById('policy-123')
 * // Returns: { id: '...', policyNumber: 'POL-TEST-001', status: 'ACTIVE', ... }
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const policy = await getPolicyById('policy-123', { signal: controller.signal })
 */
export async function getPolicyById(
  policyId: string,
  options?: RequestInit
): Promise<PolicyDetailResponse> {
  return fetchAPI<PolicyDetailResponse>(`/api/policies/${policyId}`, options)
}

/**
 * Update a policy with partial data
 *
 * Only sends fields that are defined (undefined values omitted).
 * Null values are kept (used to clear optional fields like type, copays, etc.).
 *
 * Lifecycle validation enforced by backend:
 * - PENDING policies can be edited by BROKER_EMPLOYEES
 * - ACTIVE/EXPIRED/CANCELLED policies can only be edited by SUPER_ADMIN
 * - Status transitions validated against lifecycle blueprint
 *
 * @param policyId - Policy ID to update (CUID)
 * @param updates - Partial policy updates (all fields optional)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Updated policy with all fields
 * @throws {ApiRequestError} If request fails (400, 403, 404, 409)
 *
 * @example
 * // Update single field
 * const updated = await updatePolicy('policy-123', { type: 'Dental' })
 *
 * @example
 * // Update multiple fields
 * const updated = await updatePolicy('policy-123', {
 *   ambCopay: 25,
 *   hospCopay: 50,
 *   tPremium: 100
 * })
 *
 * @example
 * // Status transition (PENDING → ACTIVE requires all fields filled)
 * const updated = await updatePolicy('policy-123', { status: 'ACTIVE' })
 *
 * @example
 * // Clear optional field
 * const updated = await updatePolicy('policy-123', { type: null })
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const updated = await updatePolicy('policy-123', { ambCopay: 30 }, { signal: controller.signal })
 */
export async function updatePolicy(
  policyId: string,
  updates: UpdatePolicyRequest,
  options?: RequestInit
): Promise<UpdatePolicyResponse> {
  // Filter out undefined values (fields not changed)
  // Keep null values (intentional field clearing)
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  )

  return fetchAPI<UpdatePolicyResponse>(`/api/policies/${policyId}`, {
    method: 'PUT',
    body: JSON.stringify(cleanedUpdates),
    ...options,
  })
}

/**
 * Get affiliates covered under a policy with optional filters
 *
 * Mirrors backend endpoint: GET /api/policies/:policyId/affiliates
 * Backend applies defaults: page=1, limit=20
 *
 * @param policyId - Policy ID (CUID)
 * @param params - Optional filters (search, affiliateType, isActive, page, limit)
 * @param options - Optional RequestInit (e.g., signal for AbortController)
 * @returns Paginated affiliates covered by the policy
 * @throws {ApiRequestError} If request fails
 */
export async function getPolicyAffiliates(
  policyId: string,
  params?: {
    search?: string
    affiliateType?: AffiliateType
    isActive?: boolean
    page?: number
    limit?: number
  },
  options?: RequestInit
): Promise<GetPolicyAffiliatesResponse> {
  const searchParams = new URLSearchParams()

  if (params?.search) {
    searchParams.append('search', params.search)
  }
  if (params?.affiliateType) {
    searchParams.append('affiliateType', params.affiliateType)
  }
  if (params?.isActive !== undefined) {
    searchParams.append('isActive', String(params.isActive))
  }
  if (params?.page !== undefined) {
    searchParams.append('page', String(params.page))
  }
  if (params?.limit !== undefined) {
    searchParams.append('limit', String(params.limit))
  }

  const qs = searchParams.toString()
  const endpoint = `/api/policies/${policyId}/affiliates${qs ? `?${qs}` : ''}`
  return fetchAPI<GetPolicyAffiliatesResponse>(endpoint, options)
}

/**
 * Add a new affiliate to a policy
 *
 * Creates new affiliate and automatically adds them to the policy.
 * Combines affiliate creation with policy enrollment in a single operation.
 *
 * @param policyId - Policy ID to add affiliate to (CUID)
 * @param data - Affiliate data (must match policy's client)
 * @param options - Optional RequestInit (e.g., signal for AbortController)
 * @returns Created affiliate with policy relationship details
 * @throws {ApiRequestError} If request fails (400, 403, 404)
 *
 * @example
 * const affiliate = await addAffiliateToPolicy('policy-123', {
 *   clientId: 'client-456',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   affiliateType: 'OWNER',
 *   email: 'john@example.com'
 * })
 * // Returns: { id: '...', firstName: 'John', policyId: 'policy-123', ... }
 */
export async function addAffiliateToPolicy(
  policyId: string,
  data: AddAffiliateToPolicyRequest,
  options?: RequestInit
): Promise<AddAffiliateToPolicyResponse> {
  return fetchAPI<AddAffiliateToPolicyResponse>(`/api/policies/${policyId}/affiliates`, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * Remove an affiliate from a policy (soft delete)
 *
 * Sets removedAt date and deactivates the relationship.
 * For OWNER affiliates, cascades removal to all dependents on the policy.
 *
 * @param policyId - Policy ID (CUID)
 * @param affiliateId - Affiliate ID to remove (CUID)
 * @param data - Removal data (removedAt date)
 * @param options - Optional RequestInit (e.g., signal for AbortController)
 * @returns Confirmation with removed affiliate and cascaded dependents
 * @throws {ApiRequestError} If request fails (400, 403, 404)
 *
 * @example
 * const result = await removeAffiliateFromPolicy('policy-123', 'affiliate-456', {
 *   removedAt: '2024-01-15'
 * })
 * // Returns: { policyId: '...', removedAffiliate: {...}, cascadedDependents: [...] }
 */
export async function removeAffiliateFromPolicy(
  policyId: string,
  affiliateId: string,
  data: RemoveAffiliateFromPolicyRequest,
  options?: RequestInit
): Promise<RemoveAffiliateFromPolicyResponse> {
  return fetchAPI<RemoveAffiliateFromPolicyResponse>(
    `/api/policies/${policyId}/affiliates/${affiliateId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    }
  )
}
