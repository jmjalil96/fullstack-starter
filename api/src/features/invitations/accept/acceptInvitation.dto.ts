/**
 * DTOs for accepting invitations
 */

import { InvitationType } from '@prisma/client'

/**
 * Response DTO - What API returns after accepting an invitation
 *
 * Used by frontend to:
 * - Confirm invitation was accepted successfully
 * - Get user's new role information
 * - Redirect to appropriate dashboard
 */
export interface AcceptInvitationResponse {
  /** Whether acceptance was successful */
  success: boolean

  /** User information after acceptance */
  user: {
    id: string
    email: string
    name: string | null
    globalRoleId: string
    globalRoleName: string
  }

  /** Invitation type that was accepted */
  type: InvitationType

  /** ID of created/linked entity (Employee, Agent, or Affiliate) */
  entityId: string

  /** Success message for the user */
  message: string
}
