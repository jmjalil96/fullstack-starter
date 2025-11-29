/**
 * Claims API service layer
 * Type-safe wrappers around fetchAPI for claims endpoints
 */

import { fetchAPI } from '../../config/api'

import type {
  AvailableAffiliateResponse,
  AvailableClientResponse,
  AvailablePatientResponse,
  AvailablePolicyResponse,
  ClaimAuditLogsResponse,
  ClaimDetailResponse,
  ClaimStatus,
  ClaimUpdateRequest,
  CreateClaimRequest,
  CreateClaimResponse,
  GetClaimsResponse,
} from './claims'

/**
 * Get available clients for claim submission
 *
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Array of clients the current user can submit claims for
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
  return fetchAPI<AvailableClientResponse[]>('/api/claims/available-clients', options)
}

/**
 * Get available affiliates for a specific client
 *
 * @param clientId - Client ID to fetch affiliates for
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Array of owner affiliates for the client
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const affiliates = await getAvailableAffiliates('client-123')
 * // Returns: [{ id: '...', firstName: 'Juan', lastName: 'Pérez', coverageType: 'FULL' }, ...]
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const affiliates = await getAvailableAffiliates('client-123', { signal: controller.signal })
 */
export async function getAvailableAffiliates(
  clientId: string,
  options?: RequestInit
): Promise<AvailableAffiliateResponse[]> {
  return fetchAPI<AvailableAffiliateResponse[]>(
    `/api/claims/available-affiliates?clientId=${encodeURIComponent(clientId)}`,
    options
  )
}

/**
 * Get available patients for a specific affiliate
 *
 * @param affiliateId - Affiliate ID to fetch patients for (affiliate + dependents)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Array of patients (affiliate as 'self' + dependents)
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const patients = await getAvailablePatients('affiliate-123')
 * // Returns: [
 * //   { id: '...', firstName: 'Juan', lastName: 'Pérez', relationship: 'self' },
 * //   { id: '...', firstName: 'María', lastName: 'Pérez', relationship: 'dependent' }
 * // ]
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const patients = await getAvailablePatients('affiliate-123', { signal: controller.signal })
 */
export async function getAvailablePatients(
  affiliateId: string,
  options?: RequestInit
): Promise<AvailablePatientResponse[]> {
  return fetchAPI<AvailablePatientResponse[]>(
    `/api/claims/available-patients?affiliateId=${encodeURIComponent(affiliateId)}`,
    options
  )
}

/**
 * Create a new claim
 *
 * @param data - Claim data (client, affiliate, patient, description)
 * @returns Created claim with claim number and details
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const claim = await createClaim({
 *   clientId: 'client-123',
 *   affiliateId: 'aff-456',
 *   patientId: 'aff-456',
 *   description: 'Consulta médica'
 * })
 * // Returns: { id: '...', claimNumber: 'RECL_ABC123', status: 'SUBMITTED', ... }
 */
export async function createClaim(data: CreateClaimRequest): Promise<CreateClaimResponse> {
  return fetchAPI<CreateClaimResponse>('/api/claims', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Get paginated list of claims with optional filters
 *
 * Returns claims based on user's role and permissions.
 * Backend applies defaults: page=1, limit=20
 *
 * @param params - Optional query parameters for filtering and pagination
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Paginated claims list with metadata
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * // Get first page with defaults
 * const response = await getClaims()
 * // Returns: { claims: [...], pagination: { total, page: 1, limit: 20, ... } }
 *
 * @example
 * // Filter by status
 * const response = await getClaims({ status: 'SUBMITTED' })
 *
 * @example
 * // With pagination
 * const response = await getClaims({ page: 2, limit: 10 })
 *
 * @example
 * // Search by claim number
 * const response = await getClaims({ search: 'RECL_ABC123' })
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const response = await getClaims({ page: 1 }, { signal: controller.signal })
 */
export async function getClaims(
  params?: {
    status?: ClaimStatus
    clientId?: string
    search?: string
    dateField?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    limit?: number
  },
  options?: RequestInit
): Promise<GetClaimsResponse> {
  // Build query string from params
  const searchParams = new URLSearchParams()

  if (params?.status) {
    searchParams.append('status', params.status)
  }
  if (params?.clientId) {
    searchParams.append('clientId', params.clientId)
  }
  if (params?.search) {
    searchParams.append('search', params.search)
  }
  if (params?.dateField) {
    searchParams.append('dateField', params.dateField)
  }
  if (params?.dateFrom) {
    searchParams.append('dateFrom', params.dateFrom)
  }
  if (params?.dateTo) {
    searchParams.append('dateTo', params.dateTo)
  }
  if (params?.page !== undefined) {
    searchParams.append('page', params.page.toString())
  }
  if (params?.limit !== undefined) {
    searchParams.append('limit', params.limit.toString())
  }

  const queryString = searchParams.toString()
  const endpoint = `/api/claims${queryString ? `?${queryString}` : ''}`

  return fetchAPI<GetClaimsResponse>(endpoint, options)
}

/**
 * Get complete claim detail by ID
 *
 * @param claimId - Claim ID to fetch
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Complete claim with all fields and related entities
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const claim = await getClaimById('claim-123')
 * // Returns: { id: '...', claimNumber: 'RECL_ABC123', status: 'SUBMITTED', ... }
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const claim = await getClaimById('claim-123', { signal: controller.signal })
 */
export async function getClaimById(
  claimId: string,
  options?: RequestInit
): Promise<ClaimDetailResponse> {
  return fetchAPI<ClaimDetailResponse>(`/api/claims/${claimId}`, options)
}

/**
 * Update a claim with partial data
 *
 * Only sends fields that are defined (undefined values omitted).
 * Null values are kept (used to clear optional fields).
 *
 * @param claimId - Claim ID to update
 * @param updates - Partial claim updates (all fields optional)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Updated claim with all fields
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * // Update single field
 * const updated = await updateClaim('claim-123', { description: 'Updated description' })
 *
 * @example
 * // Status transition
 * const updated = await updateClaim('claim-123', { status: 'VALIDATION' })
 *
 * @example
 * // Clear optional field
 * const updated = await updateClaim('claim-123', { careType: null })
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const updated = await updateClaim('claim-123', { amountSubmitted: 100 }, { signal: controller.signal })
 */
export async function updateClaim(
  claimId: string,
  updates: ClaimUpdateRequest,
  options?: RequestInit
): Promise<ClaimDetailResponse> {
  // Filter out undefined values (fields not changed)
  // Keep null values (intentional field clearing)
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  )

  return fetchAPI<ClaimDetailResponse>(`/api/claims/${claimId}`, {
    method: 'PUT',
    body: JSON.stringify(cleanedUpdates),
    ...options,
  })
}

/**
 * Get policies available for assignment to a claim
 *
 * Returns policies where:
 * - Policy belongs to claim's client
 * - Claim's affiliate is covered under the policy (PolicyAffiliate join)
 * - Policy is active and not expired
 *
 * @param claimId - Claim ID to get policies for
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Array of available policies for dropdown selection
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const policies = await getAvailablePolicies('claim-123')
 * // Returns: [{ id: '...', policyNumber: 'POL-ABC-001', type: 'Salud', insurerName: 'MAPFRE' }, ...]
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const policies = await getAvailablePolicies('claim-123', { signal: controller.signal })
 */
export async function getAvailablePolicies(
  claimId: string,
  options?: RequestInit
): Promise<AvailablePolicyResponse[]> {
  return fetchAPI<AvailablePolicyResponse[]>(
    `/api/claims/${claimId}/available-policies`,
    options
  )
}

/**
 * Get audit logs for a claim
 *
 * Returns chronological history of all changes made to the claim,
 * including invoice additions/removals and status transitions.
 *
 * @param claimId - Claim ID to fetch audit logs for
 * @param params - Optional pagination parameters
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Paginated list of audit log entries
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const logs = await getClaimAuditLogs('claim-123')
 * // Returns: { items: [...], pagination: { total, page, limit, totalPages, hasMore } }
 *
 * @example
 * // With pagination
 * const logs = await getClaimAuditLogs('claim-123', { page: 2, limit: 20 })
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const logs = await getClaimAuditLogs('claim-123', {}, { signal: controller.signal })
 */
export async function getClaimAuditLogs(
  claimId: string,
  params?: { page?: number; limit?: number },
  options?: RequestInit
): Promise<ClaimAuditLogsResponse> {
  const searchParams = new URLSearchParams()

  if (params?.page !== undefined) {
    searchParams.append('page', params.page.toString())
  }
  if (params?.limit !== undefined) {
    searchParams.append('limit', params.limit.toString())
  }

  const queryString = searchParams.toString()
  const endpoint = `/api/claims/${claimId}/audit-logs${queryString ? `?${queryString}` : ''}`

  return fetchAPI<ClaimAuditLogsResponse>(endpoint, options)
}
