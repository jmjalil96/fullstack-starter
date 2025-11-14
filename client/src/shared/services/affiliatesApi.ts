/**
 * Affiliates API service layer
 * Type-safe wrappers around fetchAPI for affiliates endpoints
 */

import { fetchAPI } from '../../config/api'
import type {
  AffiliateDetailResponse,
  AffiliateType,
  CoverageType,
  AvailableClientResponse,
  AvailableOwnerResponse,
  CreateAffiliateRequest,
  CreateAffiliateResponse,
  GetAffiliatesResponse,
  UpdateAffiliateRequest,
  UpdateAffiliateResponse,
} from '../types/affiliates'

/**
 * Get available clients for affiliate creation
 *
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Array of active clients
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const clients = await getAvailableClients()
 * // Returns: [{ id: '...', name: 'TechCorp S.A.' }, ...]
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const clients = await getAvailableClients({ signal: controller.signal })
 */
export async function getAvailableClients(
  options?: RequestInit
): Promise<AvailableClientResponse[]> {
  return fetchAPI<AvailableClientResponse[]>('/api/affiliates/available-clients', options)
}

/**
 * Get available owner affiliates for primary affiliate selection
 *
 * Returns active OWNER affiliates from the specified client.
 * Used when creating DEPENDENT affiliates to select their primary affiliate.
 *
 * @param clientId - Client ID to filter owners (CUID)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Array of owner affiliates from specified client
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const owners = await getAvailableOwners('client-123')
 * // Returns: [{ id: '...', firstName: 'Juan', lastName: 'Pérez', ... }, ...]
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const owners = await getAvailableOwners('client-123', { signal: controller.signal })
 */
export async function getAvailableOwners(
  clientId: string,
  options?: RequestInit
): Promise<AvailableOwnerResponse[]> {
  return fetchAPI<AvailableOwnerResponse[]>(
    `/api/affiliates/available-owners?clientId=${clientId}`,
    options
  )
}

/**
 * Get paginated list of affiliates with optional filters
 *
 * Returns affiliates based on user's role and permissions.
 * Backend applies defaults: page=1, limit=20
 *
 * @param params - Optional query parameters for filtering and pagination
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Paginated affiliates list with metadata
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * // Get first page with defaults
 * const response = await getAffiliates()
 * // Returns: { affiliates: [...], pagination: { total, page: 1, limit: 20, ... } }
 *
 * @example
 * // Filter by client
 * const response = await getAffiliates({ clientId: 'client-123' })
 *
 * @example
 * // Filter by type
 * const response = await getAffiliates({ affiliateType: 'OWNER' })
 *
 * @example
 * // Search by name or document
 * const response = await getAffiliates({ search: 'Juan' })
 *
 * @example
 * // Filter by coverage type
 * const response = await getAffiliates({ coverageType: 'TPLUSF' })
 *
 * @example
 * // Filter active only
 * const response = await getAffiliates({ isActive: true })
 *
 * @example
 * // With pagination
 * const response = await getAffiliates({ page: 2, limit: 10 })
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const response = await getAffiliates({ page: 1 }, { signal: controller.signal })
 */
export async function getAffiliates(
  params?: {
    clientId?: string
    search?: string
    affiliateType?: AffiliateType
    coverageType?: CoverageType
    isActive?: boolean
    page?: number
    limit?: number
  },
  options?: RequestInit
): Promise<GetAffiliatesResponse> {
  // Build query string from params
  const searchParams = new URLSearchParams()

  if (params?.clientId) {
    searchParams.append('clientId', params.clientId)
  }
  if (params?.search) {
    searchParams.append('search', params.search)
  }
  if (params?.affiliateType) {
    searchParams.append('affiliateType', params.affiliateType)
  }
  if (params?.coverageType) {
    searchParams.append('coverageType', params.coverageType)
  }
  if (params?.isActive !== undefined) {
    searchParams.append('isActive', params.isActive.toString())
  }
  if (params?.page !== undefined) {
    searchParams.append('page', params.page.toString())
  }
  if (params?.limit !== undefined) {
    searchParams.append('limit', params.limit.toString())
  }

  const queryString = searchParams.toString()
  const endpoint = `/api/affiliates${queryString ? `?${queryString}` : ''}`

  return fetchAPI<GetAffiliatesResponse>(endpoint, options)
}

/**
 * Get complete affiliate detail by ID
 *
 * @param affiliateId - Affiliate ID to fetch (CUID)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Complete affiliate data with all fields and related entities
 * @throws {ApiRequestError} If request fails (404 if not found or no access)
 *
 * @example
 * const affiliate = await getAffiliateById('affiliate-123')
 * // Returns: { id: '...', firstName: 'Juan', lastName: 'Pérez', ... }
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const affiliate = await getAffiliateById('affiliate-123', { signal: controller.signal })
 */
export async function getAffiliateById(
  affiliateId: string,
  options?: RequestInit
): Promise<AffiliateDetailResponse> {
  return fetchAPI<AffiliateDetailResponse>(`/api/affiliates/${affiliateId}`, options)
}

/**
 * Create a new affiliate
 *
 * Business rules:
 * - OWNER affiliates require email
 * - DEPENDENT affiliates require primaryAffiliateId
 * - email is optional for DEPENDENT affiliates
 * - Primary affiliate must be OWNER type from same client
 *
 * @param data - Affiliate data (firstName, lastName, email, type, etc.)
 * @returns Created affiliate with all fields
 * @throws {ApiRequestError} If request fails (400, 403, 404, 409)
 *
 * @example
 * // Create OWNER affiliate
 * const owner = await createAffiliate({
 *   clientId: 'client-123',
 *   firstName: 'Juan',
 *   lastName: 'Pérez',
 *   email: 'juan.perez@company.com',
 *   phone: '+51987654321',
 *   documentType: 'DNI',
 *   documentNumber: '12345678',
 *   affiliateType: 'OWNER',
 *   coverageType: 'TPLUSF'
 * })
 *
 * @example
 * // Create DEPENDENT affiliate
 * const dependent = await createAffiliate({
 *   clientId: 'client-123',
 *   firstName: 'María',
 *   lastName: 'Pérez',
 *   dateOfBirth: '2010-05-15',
 *   documentType: 'DNI',
 *   documentNumber: '87654321',
 *   affiliateType: 'DEPENDENT',
 *   primaryAffiliateId: 'owner-affiliate-id'
 * })
 */
export async function createAffiliate(
  data: CreateAffiliateRequest
): Promise<CreateAffiliateResponse> {
  return fetchAPI<CreateAffiliateResponse>('/api/affiliates', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Update an existing affiliate (partial update)
 *
 * Only sends fields that are defined (undefined values omitted).
 * Null values are kept (used to clear optional fields).
 *
 * Business rules enforced by backend:
 * - OWNER affiliates must have email
 * - DEPENDENT affiliates must have primaryAffiliateId
 * - Cannot change clientId (immutable)
 * - Primary affiliate must be OWNER type from same client
 *
 * @param affiliateId - Affiliate ID to update (CUID)
 * @param updates - Partial affiliate updates (all fields optional)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Updated affiliate with all fields
 * @throws {ApiRequestError} If request fails (400, 403, 404, 409)
 *
 * @example
 * // Update single field
 * const updated = await updateAffiliate('affiliate-123', { phone: '+51999888777' })
 *
 * @example
 * // Update multiple fields
 * const updated = await updateAffiliate('affiliate-123', {
 *   firstName: 'Juan Carlos',
 *   email: 'newemail@company.com',
 *   coverageType: 'TPLUS1'
 * })
 *
 * @example
 * // Change DEPENDENT to OWNER
 * const updated = await updateAffiliate('affiliate-123', {
 *   affiliateType: 'OWNER',
 *   primaryAffiliateId: null,
 *   email: 'juan@company.com'
 * })
 *
 * @example
 * // Clear optional field
 * const updated = await updateAffiliate('affiliate-123', { phone: null })
 *
 * @example
 * // Deactivate affiliate
 * const updated = await updateAffiliate('affiliate-123', { isActive: false })
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const updated = await updateAffiliate('affiliate-123', { email: 'new@email.com' }, { signal: controller.signal })
 */
export async function updateAffiliate(
  affiliateId: string,
  updates: UpdateAffiliateRequest,
  options?: RequestInit
): Promise<UpdateAffiliateResponse> {
  // Filter out undefined values (fields not changed)
  // Keep null values (intentional field clearing)
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  )

  return fetchAPI<UpdateAffiliateResponse>(`/api/affiliates/${affiliateId}`, {
    method: 'PUT',
    body: JSON.stringify(cleanedUpdates),
    ...options,
  })
}
