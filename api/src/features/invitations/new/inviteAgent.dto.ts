/**
 * DTOs for inviting agents
 */

import { InvitationStatus, InvitationType } from '@prisma/client'

/**
 * Request DTO - What client sends to invite an agent
 */
export interface InviteAgentRequest {
  /** Email address for the invitation */
  email: string

  /** Agent's first name */
  firstName: string

  /** Agent's last name */
  lastName: string

  /** Agent's phone number (optional) */
  phone?: string

  /** Agent code/ID (optional, must be unique if provided) */
  agentCode?: string

  /** Role ID to assign upon acceptance */
  roleId: string
}

/**
 * Response DTO - What API returns after creating invitation
 */
export interface InviteAgentResponse {
  // Core identification
  id: string
  email: string
  token: string

  // Invitation type and status
  type: InvitationType
  status: InvitationStatus

  // Role info (flat)
  roleId: string
  roleName: string

  // Entity data (stored for agent creation on acceptance)
  entityData: {
    firstName: string
    lastName: string
    phone: string | null
    agentCode: string | null
  }

  // Creator info (flat)
  createdById: string
  createdByName: string | null

  // Dates (ISO strings)
  expiresAt: string
  createdAt: string
}
