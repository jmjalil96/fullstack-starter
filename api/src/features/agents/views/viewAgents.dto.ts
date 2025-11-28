/**
 * DTOs for viewing/listing agents
 */

/**
 * Query parameters for GET /api/agents
 */
export interface GetAgentsQueryParams {
  /** Search by name, email, or agent code */
  search?: string
  /** Filter by active status */
  isActive?: boolean
  /** Page number (>= 1, default: 1) */
  page?: number
  /** Items per page (1-100, default: 20) */
  limit?: number
}

/**
 * Single agent item in list view
 */
export interface AgentListItemResponse {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  agentCode: string | null
  userId: string | null
  hasUserAccount: boolean
  isActive: boolean
  createdAt: string
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

/**
 * Response from GET /api/agents
 */
export interface GetAgentsResponse {
  agents: AgentListItemResponse[]
  pagination: PaginationMetadata
}
