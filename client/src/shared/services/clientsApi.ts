/**
 * Clients API service layer
 * Type-safe wrappers around fetchAPI for clients endpoints
 */

import { fetchAPI } from '../../config/api'
import type {
  ClientDetailResponse,
  CreateClientRequest,
  CreateClientResponse,
  GetClientsResponse,
  UpdateClientRequest,
  UpdateClientResponse,
} from '../types/clients'

/**
 * Get paginated list of clients with optional filters
 *
 * @param params - Optional query parameters (search, isActive, page, limit)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Clients list with pagination metadata
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * // Get all clients (first page, default limit)
 * const response = await getClients()
 * // Returns: { clients: [...], pagination: {...} }
 *
 * @example
 * // With filters
 * const response = await getClients({ search: 'tech', isActive: true, page: 2, limit: 10 })
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const response = await getClients({ page: 1 }, { signal: controller.signal })
 */
export async function getClients(
  params?: {
    search?: string
    isActive?: boolean
    page?: number
    limit?: number
  },
  options?: RequestInit
): Promise<GetClientsResponse> {
  // Build query string
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
  const endpoint = queryString ? `/api/clients?${queryString}` : '/api/clients'

  return fetchAPI<GetClientsResponse>(endpoint, options)
}

/**
 * Get complete client detail by ID
 *
 * @param clientId - Client ID (CUID)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Complete client data
 * @throws {ApiRequestError} If request fails or not found (404)
 *
 * @example
 * const client = await getClientById('client-123')
 * // Returns: { id: '...', name: 'TechCorp', taxId: '...', ... }
 */
export async function getClientById(
  clientId: string,
  options?: RequestInit
): Promise<ClientDetailResponse> {
  return fetchAPI<ClientDetailResponse>(`/api/clients/${clientId}`, options)
}

/**
 * Create a new client
 *
 * @param data - Client data (name, taxId, optional contact info)
 * @returns Created client
 * @throws {ApiRequestError} If request fails (400, 403, 409)
 *
 * @example
 * const client = await createClient({
 *   name: 'New Company',
 *   taxId: '12345678901',
 *   email: 'contact@company.com'
 * })
 */
export async function createClient(data: CreateClientRequest): Promise<CreateClientResponse> {
  return fetchAPI<CreateClientResponse>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Update an existing client (partial update)
 *
 * Only sends fields that are defined (undefined values omitted).
 * Null values are kept (used to clear optional fields).
 *
 * @param clientId - Client ID (CUID)
 * @param updates - Partial client updates (all fields optional)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Updated client with all fields
 * @throws {ApiRequestError} If request fails (400, 403, 404, 409)
 *
 * @example
 * // Update single field
 * const client = await updateClient('client-123', { email: 'newemail@company.com' })
 *
 * @example
 * // Deactivate client
 * const client = await updateClient('client-123', { isActive: false })
 *
 * @example
 * // Clear optional field
 * const client = await updateClient('client-123', { phone: null })
 */
export async function updateClient(
  clientId: string,
  updates: UpdateClientRequest,
  options?: RequestInit
): Promise<UpdateClientResponse> {
  // Filter out undefined values (fields not changed)
  // Keep null values (intentional field clearing)
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  )

  return fetchAPI<UpdateClientResponse>(`/api/clients/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(cleanedUpdates),
    ...options,
  })
}
