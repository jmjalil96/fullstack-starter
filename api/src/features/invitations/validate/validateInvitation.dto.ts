/**
 * DTOs for validating invitations
 */

import { InvitationType } from '@prisma/client'

/**
 * Response DTO - What API returns when validating an invitation token
 *
 * Used by frontend to:
 * - Show error if invalid/expired
 * - Pre-fill signup form with email and name if valid
 */
export interface ValidateInvitationResponse {
  /** Whether the invitation token is valid */
  valid: boolean

  /** Email address (only if valid) */
  email: string | null

  /** Invitation type (only if valid) */
  type: InvitationType | null

  /** Invitee name from entityData or affiliate (only if valid) */
  name: string | null

  /** Expiration date ISO string (only if valid) */
  expiresAt: string | null

  /** Error reason (only if invalid) */
  reason: string | null
}
