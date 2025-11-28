/**
 * DTOs for editing agents
 */

/**
 * Request DTO - What client sends to edit an agent
 */
export interface EditAgentRequest {
  firstName?: string
  lastName?: string
  phone?: string | null
  agentCode?: string | null
}

/**
 * Response DTO - What API returns after editing an agent
 */
export interface EditAgentResponse {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  agentCode: string | null
  isActive: boolean
  message: string
}
