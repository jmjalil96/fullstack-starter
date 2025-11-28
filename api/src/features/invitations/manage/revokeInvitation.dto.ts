/**
 * DTOs for revoking invitations
 */

import { InvitationStatus, InvitationType } from '@prisma/client'

/**
 * Response DTO - What API returns after revoking an invitation
 */
export interface RevokeInvitationResponse {
  /** Invitation ID */
  id: string

  /** Email address */
  email: string

  /** Invitation type */
  type: InvitationType

  /** Invitation status (always REVOKED after revoke) */
  status: InvitationStatus

  /** Success message */
  message: string
}
