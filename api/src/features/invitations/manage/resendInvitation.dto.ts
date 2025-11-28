/**
 * DTOs for resending invitations
 */

import { InvitationStatus, InvitationType } from '@prisma/client'

/**
 * Response DTO - What API returns after resending an invitation
 */
export interface ResendInvitationResponse {
  /** Invitation ID */
  id: string

  /** Email address */
  email: string

  /** Invitation type */
  type: InvitationType

  /** Invitation status (always PENDING after resend) */
  status: InvitationStatus

  /** New expiration date (ISO string) */
  expiresAt: string

  /** Success message */
  message: string
}
