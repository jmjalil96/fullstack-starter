/**
 * resendInvitation.service.ts
 * Service for resending pending invitations
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { InvitationStatus, InvitationType } from '@prisma/client'

import { db } from '../../../config/database.js'
import { sendInvitationEmail } from '../../../lib/email.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { ResendInvitationResponse } from './resendInvitation.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** User context type (returned from getUserWithContext) */
interface UserContext {
  id: string
  name: string | null
  globalRole: { name: string } | null
}

/** Entity data structure for Employee/Agent invitations */
interface EntityData {
  firstName?: string
  lastName?: string
}

/** Invitation expiration in days */
const INVITATION_EXPIRATION_DAYS = 7

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Resend a pending or expired invitation
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES can resend invitations
 *
 * Business Logic:
 * - If EXPIRED, reset status to PENDING and extend expiration
 * - If PENDING, just extend expiration
 * - Re-send email with same token
 * - Cannot resend ACCEPTED or REVOKED invitations
 *
 * @param userId - ID of user resending the invitation
 * @param invitationId - ID of invitation to resend
 * @returns Resend response with updated invitation info
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role not allowed
 * @throws {NotFoundError} If invitation not found
 * @throws {BadRequestError} If invitation cannot be resent (ACCEPTED/REVOKED)
 */
export async function resendInvitation(
  userId: string,
  invitationId: string
): Promise<ResendInvitationResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (only broker employees)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized invitation resend attempt')
    throw new ForbiddenError('No tienes permiso para reenviar invitaciones')
  }

  // STEP 3: Find Invitation
  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    include: {
      affiliate: {
        select: { firstName: true, lastName: true },
      },
    },
  })

  if (!invitation) {
    throw new NotFoundError('Invitación no encontrada')
  }

  // STEP 4: Validate Status (only PENDING or EXPIRED can be resent)
  if (invitation.status === InvitationStatus.ACCEPTED) {
    throw new BadRequestError('No se puede reenviar una invitación ya aceptada')
  }

  if (invitation.status === InvitationStatus.REVOKED) {
    throw new BadRequestError('No se puede reenviar una invitación revocada')
  }

  // STEP 5: Calculate New Expiration Date
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRATION_DAYS)

  // STEP 6: Update Invitation (reset to PENDING if EXPIRED, extend expiration)
  const updatedInvitation = await db.invitation.update({
    where: { id: invitationId },
    data: {
      status: InvitationStatus.PENDING,
      expiresAt,
    },
  })

  // STEP 7: Extract Invitee Name
  let inviteeName: string

  if (invitation.type === InvitationType.AFFILIATE && invitation.affiliate) {
    inviteeName = `${invitation.affiliate.firstName} ${invitation.affiliate.lastName}`
  } else if (invitation.entityData) {
    const entityData = invitation.entityData as unknown as EntityData
    inviteeName = entityData.firstName && entityData.lastName
      ? `${entityData.firstName} ${entityData.lastName}`
      : invitation.email
  } else {
    inviteeName = invitation.email
  }

  // STEP 8: Re-send Email
  const inviterName = user.name ?? 'Un administrador'

  try {
    await sendInvitationEmail(
      invitation.email,
      invitation.token,
      invitation.type,
      inviteeName,
      inviterName
    )
  } catch (error) {
    logger.error(
      { error, email: invitation.email, invitationId },
      'Failed to resend invitation email'
    )
  }

  // STEP 9: Log Activity
  logger.info(
    {
      userId,
      invitationId,
      email: invitation.email,
      type: invitation.type,
      previousStatus: invitation.status,
    },
    'Invitation resent'
  )

  // STEP 10: Return Response
  return {
    id: updatedInvitation.id,
    email: updatedInvitation.email,
    type: updatedInvitation.type,
    status: updatedInvitation.status,
    expiresAt: updatedInvitation.expiresAt.toISOString(),
    message: 'Invitación reenviada exitosamente',
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with role context
 *
 * @param userId - User ID to load
 * @returns User with role data
 */
async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      globalRole: {
        select: { name: true },
      },
    },
  })
}
