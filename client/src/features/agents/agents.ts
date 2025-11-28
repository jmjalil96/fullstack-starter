/**
 * Agents type definitions
 * Mirrors backend DTOs from api/src/features/agents/
 */

import type { PaginationMetadata } from '../../shared/types/common'

// Re-export for convenience
export type { PaginationMetadata }

/**
 * Single agent item in list view
 * Mirrors: api/src/features/agents/views/viewAgents.dto.ts
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
 * Response from GET /api/agents
 * Mirrors: api/src/features/agents/views/viewAgents.dto.ts
 */
export interface GetAgentsResponse {
  agents: AgentListItemResponse[]
  pagination: PaginationMetadata
}

/**
 * Complete agent detail (same as list item for now)
 * Used for GET /api/agents/:id
 */
export interface AgentDetailResponse {
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
  updatedAt: string
}

/**
 * Update agent request body
 * Mirrors: api/src/features/agents/edit/editAgent.dto.ts
 * Sent to PATCH /api/agents/:id
 */
export interface UpdateAgentRequest {
  firstName?: string
  lastName?: string
  phone?: string | null
  agentCode?: string | null
  isActive?: boolean
}

/**
 * Update agent response
 * Mirrors: api/src/features/agents/edit/editAgent.dto.ts
 * Returned from PATCH /api/agents/:id
 */
export interface UpdateAgentResponse {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  agentCode: string | null
  isActive: boolean
  message: string
}
