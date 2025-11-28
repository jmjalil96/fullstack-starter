/**
 * Agents API service layer
 * Type-safe wrappers around fetchAPI for agents endpoints
 */

import { fetchAPI } from '../../config/api'

import type {
  AgentDetailResponse,
  GetAgentsResponse,
  UpdateAgentRequest,
  UpdateAgentResponse,
} from './agents'

/**
 * Get paginated list of agents with optional filters
 *
 * @param params - Optional query parameters for filtering and pagination
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Paginated agents list with metadata
 * @throws {ApiRequestError} If request fails
 */
export async function getAgents(
  params?: {
    search?: string
    isActive?: boolean
    page?: number
    limit?: number
  },
  options?: RequestInit
): Promise<GetAgentsResponse> {
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
  const endpoint = `/api/agents${queryString ? `?${queryString}` : ''}`

  return fetchAPI<GetAgentsResponse>(endpoint, options)
}

/**
 * Get complete agent detail by ID
 *
 * @param agentId - Agent ID to fetch (CUID)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Complete agent data with all fields
 * @throws {ApiRequestError} If request fails (404 if not found)
 */
export async function getAgentById(
  agentId: string,
  options?: RequestInit
): Promise<AgentDetailResponse> {
  return fetchAPI<AgentDetailResponse>(`/api/agents/${agentId}`, options)
}

/**
 * Update an existing agent (partial update)
 *
 * @param agentId - Agent ID to update (CUID)
 * @param updates - Partial agent updates (all fields optional)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Updated agent with all fields
 * @throws {ApiRequestError} If request fails (400, 403, 404)
 */
export async function updateAgent(
  agentId: string,
  updates: UpdateAgentRequest,
  options?: RequestInit
): Promise<UpdateAgentResponse> {
  // Filter out undefined values (fields not changed)
  // Keep null values (intentional field clearing)
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  )

  return fetchAPI<UpdateAgentResponse>(`/api/agents/${agentId}`, {
    method: 'PATCH',
    body: JSON.stringify(cleanedUpdates),
    ...options,
  })
}
