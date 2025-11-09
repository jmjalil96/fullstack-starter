/**
 * Clients type definitions
 * Mirrors backend DTOs from api/src/features/clients/
 */

/**
 * Single client item in list view
 * Mirrors: api/src/features/clients/views/viewClients.dto.ts
 */
export interface ClientListItemResponse {
  id: string
  name: string
  taxId: string
  email: string | null
  phone: string | null
  address: string | null
  isActive: boolean
  createdAt: string
}

/**
 * Pagination metadata
 * Mirrors: api/src/features/clients/views/viewClients.dto.ts
 */
export interface PaginationMetadata {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

/**
 * Response from GET /api/clients
 * Mirrors: api/src/features/clients/views/viewClients.dto.ts
 */
export interface GetClientsResponse {
  clients: ClientListItemResponse[]
  pagination: PaginationMetadata
}

/**
 * Complete client detail with all fields
 * Mirrors: api/src/features/clients/views/clientDetail.dto.ts
 */
export interface ClientDetailResponse {
  id: string
  name: string
  taxId: string
  email: string | null
  phone: string | null
  address: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Create client request body
 * Mirrors: api/src/features/clients/new/createClient.dto.ts
 */
export interface CreateClientRequest {
  name: string
  taxId: string
  email?: string
  phone?: string
  address?: string
}

/**
 * Create client response
 * Mirrors: api/src/features/clients/new/createClient.dto.ts
 */
export interface CreateClientResponse {
  id: string
  name: string
  taxId: string
  email: string | null
  phone: string | null
  address: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Update client request body
 * Mirrors: api/src/features/clients/edit/clientEdit.dto.ts
 */
export interface UpdateClientRequest {
  name?: string
  taxId?: string
  email?: string | null
  phone?: string | null
  address?: string | null
  isActive?: boolean
}

/**
 * Update client response (same as detail response)
 * Mirrors: api/src/features/clients/edit/clientEdit.dto.ts
 */
export type UpdateClientResponse = ClientDetailResponse
