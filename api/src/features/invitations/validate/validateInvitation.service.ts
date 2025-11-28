/**
 * validateInvitation.service.ts
 * Service for validating invitation tokens (public, no auth required)
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { InvitationStatus, InvitationType } from '@prisma/client'

import { db } from '../../../config/database.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { ValidateInvitationResponse } from './validateInvitation.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Entity data structure for Employee/Agent invitations */
interface EntityData {
  firstName?: string
  lastName?: string
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Validate an invitation token
 *
 * This is a PUBLIC endpoint - no authentication required.
 * Used by frontend to check if token is valid before showing signup form.
 *
 * Business Logic:
 * - Find invitation by token
 * - Check status is PENDING (not already accepted/revoked)
 * - Check not expired (auto-update to EXPIRED if past expiresAt)
 * - Return validation result with invitation details for valid tokens
 *
 * @param token - Invitation token from URL
 * @returns Validation result with invitation details if valid
 */
export async function validateInvitation(
  token: string
): Promise<ValidateInvitationResponse> {
  // STEP 1: Find Invitation by Token
  const invitation = await db.invitation.findUnique({
    where: { token },
    include: {
      affiliate: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  // STEP 2: Check Invitation Exists
  if (!invitation) {
    logger.warn({ token: token.substring(0, 8) + '...' }, 'Invalid invitation token')
    return {
      valid: false,
      email: null,
      type: null,
      name: null,
      expiresAt: null,
      reason: 'Invitación no encontrada',
    }
  }

  // STEP 3: Check Status is PENDING
  if (invitation.status === InvitationStatus.ACCEPTED) {
    return {
      valid: false,
      email: null,
      type: null,
      name: null,
      expiresAt: null,
      reason: 'Esta invitación ya fue aceptada',
    }
  }

  if (invitation.status === InvitationStatus.REVOKED) {
    return {
      valid: false,
      email: null,
      type: null,
      name: null,
      expiresAt: null,
      reason: 'Esta invitación fue revocada',
    }
  }

  if (invitation.status === InvitationStatus.EXPIRED) {
    return {
      valid: false,
      email: null,
      type: null,
      name: null,
      expiresAt: null,
      reason: 'Esta invitación ha expirado',
    }
  }

  // STEP 4: Check Expiration (auto-update to EXPIRED if past)
  const now = new Date()
  if (invitation.expiresAt < now) {
    // Update status to EXPIRED
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.EXPIRED },
    })

    logger.info(
      { invitationId: invitation.id, email: invitation.email },
      'Invitation auto-expired during validation'
    )

    return {
      valid: false,
      email: null,
      type: null,
      name: null,
      expiresAt: null,
      reason: 'Esta invitación ha expirado',
    }
  }

  // STEP 5: Extract Name Based on Invitation Type
  let name: string | null = null

  if (invitation.type === InvitationType.AFFILIATE && invitation.affiliate) {
    // For affiliate invitations, get name from linked affiliate
    name = `${invitation.affiliate.firstName} ${invitation.affiliate.lastName}`
  } else if (invitation.entityData) {
    // For employee/agent invitations, get name from entityData
    const entityData = invitation.entityData as EntityData
    if (entityData.firstName && entityData.lastName) {
      name = `${entityData.firstName} ${entityData.lastName}`
    }
  }

  // STEP 6: Return Valid Response
  logger.info(
    { invitationId: invitation.id, email: invitation.email, type: invitation.type },
    'Invitation token validated'
  )

  return {
    valid: true,
    email: invitation.email,
    type: invitation.type,
    name,
    expiresAt: invitation.expiresAt.toISOString(),
    reason: null,
  }
}
