/**
 * Insurers API service layer
 * Type-safe wrappers around fetchAPI for insurers endpoints
 */

import { fetchAPI } from '../../config/api'

import type {
  CreateInsurerRequest,
  CreateInsurerResponse,
  GetInsurersResponse,
  InsurerDetailResponse,
  UpdateInsurerRequest,
  UpdateInsurerResponse,
} from './insurers'

/**
 * Get paginated list of insurers with optional filters
 *
 * Returns insurers based on user's role and permissions.
 * Backend applies defaults: page=1, limit=10
 *
 * @param params - Optional query parameters for filtering and pagination
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Paginated insurers list with metadata
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * // Get first page with defaults
 * const response = await getInsurers()
 * // Returns: { insurers: [...], pagination: { total, page: 1, limit: 10, ... } }
 *
 * @example
 * // Search by name or code
 * const response = await getInsurers({ search: 'MAPFRE' })
 *
 * @example
 * // Filter active only
 * const response = await getInsurers({ isActive: true })
 *
 * @example
 * // With pagination
 * const response = await getInsurers({ page: 2, limit: 10 })
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const response = await getInsurers({ page: 1 }, { signal: controller.signal })
 */
export async function getInsurers(
  params?: {
    search?: string
    isActive?: boolean
    page?: number
    limit?: number
  },
  options?: RequestInit
): Promise<GetInsurersResponse> {
  // Build query string from params
  const searchParams = new URLSearchParams()

  if (params?.search) {
    searchParams.append('search', params.search)
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
  const endpoint = `/api/insurers${queryString ? `?${queryString}` : ''}`

  return fetchAPI<GetInsurersResponse>(endpoint, options)
}

/**
 * Get complete insurer detail by ID
 *
 * @param insurerId - Insurer ID to fetch (CUID)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Complete insurer data with all fields
 * @throws {ApiRequestError} If request fails (404 if not found)
 *
 * @example
 * const insurer = await getInsurerById('insurer-123')
 * // Returns: { id: '...', name: 'MAPFRE', code: 'MAPFRE', ... }
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const insurer = await getInsurerById('insurer-123', { signal: controller.signal })
 */
export async function getInsurerById(
  insurerId: string,
  options?: RequestInit
): Promise<InsurerDetailResponse> {
  return fetchAPI<InsurerDetailResponse>(`/api/insurers/${insurerId}`, options)
}

/**
 * Create a new insurer
 *
 * Business rules enforced by backend:
 * - Name must be unique
 * - Code must be unique (if provided)
 *
 * @param data - Insurer data to create
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Created insurer with all fields
 * @throws {ApiRequestError} If request fails (400, 403, 409)
 *
 * @example
 * const insurer = await createInsurer({
 *   name: 'MAPFRE',
 *   code: 'MAPFRE',
 *   email: 'contacto@mapfre.com.pe',
 *   phone: '+51-1-2345678',
 *   website: 'https://www.mapfre.com.pe'
 * })
 *
 * @example
 * // Minimal creation
 * const insurer = await createInsurer({ name: 'New Insurance' })
 */
export async function createInsurer(
  data: CreateInsurerRequest,
  options?: RequestInit
): Promise<CreateInsurerResponse> {
  // Filter out undefined values
  const cleanedData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  )

  return fetchAPI<CreateInsurerResponse>('/api/insurers', {
    method: 'POST',
    body: JSON.stringify(cleanedData),
    ...options,
  })
}

/**
 * Update an existing insurer (partial update)
 *
 * Only sends fields that are defined (undefined values omitted).
 * Null values are kept (used to clear optional fields).
 *
 * Business rules enforced by backend:
 * - Name must be unique if changed
 * - Code must be unique if changed
 *
 * @param insurerId - Insurer ID to update (CUID)
 * @param updates - Partial insurer updates (all fields optional)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Updated insurer with all fields
 * @throws {ApiRequestError} If request fails (400, 403, 404, 409)
 *
 * @example
 * // Update single field
 * const updated = await updateInsurer('insurer-123', { email: 'new@email.com' })
 *
 * @example
 * // Update multiple fields
 * const updated = await updateInsurer('insurer-123', {
 *   name: 'MAPFRE Seguros',
 *   phone: '+51-1-9999999',
 *   website: 'https://www.mapfre.com'
 * })
 *
 * @example
 * // Clear optional field
 * const updated = await updateInsurer('insurer-123', { code: null })
 *
 * @example
 * // Deactivate insurer
 * const updated = await updateInsurer('insurer-123', { isActive: false })
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const updated = await updateInsurer('insurer-123', { email: 'new@email.com' }, { signal: controller.signal })
 */
export async function updateInsurer(
  insurerId: string,
  updates: UpdateInsurerRequest,
  options?: RequestInit
): Promise<UpdateInsurerResponse> {
  // Filter out undefined values (fields not changed)
  // Keep null values (intentional field clearing)
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  )

  return fetchAPI<UpdateInsurerResponse>(`/api/insurers/${insurerId}`, {
    method: 'PUT',
    body: JSON.stringify(cleanedUpdates),
    ...options,
  })
}
