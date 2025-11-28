/**
 * revokeInvitation.service.ts
 * Service for revoking pending invitations
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { InvitationStatus } from '@prisma/client'

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { RevokeInvitationResponse } from './revokeInvitation.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** User context type (returned from getUserWithContext) */
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Revoke a pending invitation
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES can revoke invitations
 *
 * Business Logic:
 * - Only PENDING invitations can be revoked
 * - Sets status to REVOKED
 * - Token becomes invalid
 *
 * @param userId - ID of user revoking the invitation
 * @param invitationId - ID of invitation to revoke
 * @returns Revoke response with updated invitation info
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role not allowed
 * @throws {NotFoundError} If invitation not found
 * @throws {BadRequestError} If invitation cannot be revoked (not PENDING)
 */
export async function revokeInvitation(
  userId: string,
  invitationId: string
): Promise<RevokeInvitationResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (only broker employees)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized invitation revoke attempt')
    throw new ForbiddenError('No tienes permiso para revocar invitaciones')
  }

  // STEP 3: Find Invitation
  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
  })

  if (!invitation) {
    throw new NotFoundError('Invitación no encontrada')
  }

  // STEP 4: Validate Status (only PENDING can be revoked)
  if (invitation.status === InvitationStatus.ACCEPTED) {
    throw new BadRequestError('No se puede revocar una invitación ya aceptada')
  }

  if (invitation.status === InvitationStatus.REVOKED) {
    throw new BadRequestError('Esta invitación ya fue revocada')
  }

  if (invitation.status === InvitationStatus.EXPIRED) {
    throw new BadRequestError('No se puede revocar una invitación expirada')
  }

  // STEP 5: Update Invitation Status to REVOKED
  const updatedInvitation = await db.invitation.update({
    where: { id: invitationId },
    data: {
      status: InvitationStatus.REVOKED,
    },
  })

  // STEP 6: Log Activity
  logger.info(
    {
      userId,
      invitationId,
      email: invitation.email,
      type: invitation.type,
    },
    'Invitation revoked'
  )

  // STEP 7: Return Response
  return {
    id: updatedInvitation.id,
    email: updatedInvitation.email,
    type: updatedInvitation.type,
    status: updatedInvitation.status,
    message: 'Invitación revocada exitosamente',
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
      globalRole: {
        select: { name: true },
      },
    },
  })
}
