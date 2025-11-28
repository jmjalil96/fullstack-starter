/**
 * acceptInvitation.service.ts
 * Service for accepting invitations and creating/linking user entities
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { InvitationStatus, InvitationType } from '@prisma/client'

import { db } from '../../../config/database.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { AcceptInvitationResponse } from './acceptInvitation.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Entity data stored in invitation.entityData for Employee */
interface EmployeeEntityData {
  firstName: string
  lastName: string
  phone: string | null
  position: string | null
  department: string | null
  employeeCode: string | null
}

/** Entity data stored in invitation.entityData for Agent */
interface AgentEntityData {
  firstName: string
  lastName: string
  phone: string | null
  agentCode: string | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Accept an invitation and create/link the appropriate entity
 *
 * Security:
 * - CRITICAL: User's email MUST match the invitation email
 * - Token must be valid and PENDING status
 * - Invitation must not be expired
 *
 * Business Logic:
 * - EMPLOYEE: Create new Employee from entityData, link to User
 * - AGENT: Create new Agent from entityData, link to User
 * - AFFILIATE: Link existing Affiliate to User (affiliateId stored in invitation)
 * - Assign globalRole to User
 * - Mark invitation as ACCEPTED
 *
 * @param userId - ID of authenticated user accepting the invitation
 * @param token - Invitation token from URL
 * @returns Acceptance response with user and entity information
 * @throws {NotFoundError} If invitation not found
 * @throws {BadRequestError} If invitation expired or already used
 * @throws {ForbiddenError} If user email doesn't match invitation email
 */
export async function acceptInvitation(
  userId: string,
  token: string
): Promise<AcceptInvitationResponse> {
  // STEP 1: Load User with Email (needed for security check)
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })

  if (!user) {
    throw new NotFoundError('Usuario no encontrado')
  }

  // STEP 2: Find Invitation by Token
  const invitation = await db.invitation.findUnique({
    where: { token },
    include: {
      role: {
        select: { id: true, name: true },
      },
      affiliate: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })

  // STEP 3: Validate Invitation Exists
  if (!invitation) {
    logger.warn({ token: token.substring(0, 8) + '...' }, 'Invalid invitation token on accept')
    throw new NotFoundError('Invitación no encontrada')
  }

  // STEP 4: Validate Status is PENDING
  if (invitation.status === InvitationStatus.ACCEPTED) {
    throw new BadRequestError('Esta invitación ya fue aceptada')
  }

  if (invitation.status === InvitationStatus.REVOKED) {
    throw new BadRequestError('Esta invitación fue revocada')
  }

  if (invitation.status === InvitationStatus.EXPIRED) {
    throw new BadRequestError('Esta invitación ha expirado')
  }

  // STEP 5: Check Expiration (auto-update to EXPIRED if past)
  const now = new Date()
  if (invitation.expiresAt < now) {
    // Update status to EXPIRED
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.EXPIRED },
    })

    logger.info(
      { invitationId: invitation.id, email: invitation.email },
      'Invitation auto-expired during acceptance'
    )

    throw new BadRequestError('Esta invitación ha expirado')
  }

  // STEP 6: CRITICAL - Email Security Check
  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    logger.warn(
      {
        userId,
        userEmail: user.email,
        invitationEmail: invitation.email,
        invitationId: invitation.id,
      },
      'Email mismatch on invitation acceptance attempt'
    )
    throw new ForbiddenError(
      'El correo electrónico de tu cuenta no coincide con el de la invitación'
    )
  }

  // STEP 7: Execute Transaction
  const result = await db.$transaction(async (tx) => {
    let createdEntityId: string

    // Create or link entity based on invitation type
    switch (invitation.type) {
      case InvitationType.EMPLOYEE: {
        const entityData = invitation.entityData as unknown as EmployeeEntityData
        const employee = await tx.employee.create({
          data: {
            firstName: entityData.firstName,
            lastName: entityData.lastName,
            email: invitation.email,
            phone: entityData.phone,
            position: entityData.position,
            department: entityData.department,
            employeeCode: entityData.employeeCode,
            userId: userId,
            isActive: true,
          },
        })
        createdEntityId = employee.id
        break
      }

      case InvitationType.AGENT: {
        const entityData = invitation.entityData as unknown as AgentEntityData
        const agent = await tx.agent.create({
          data: {
            firstName: entityData.firstName,
            lastName: entityData.lastName,
            email: invitation.email,
            phone: entityData.phone,
            agentCode: entityData.agentCode,
            userId: userId,
            isActive: true,
          },
        })
        createdEntityId = agent.id
        break
      }

      case InvitationType.AFFILIATE: {
        if (!invitation.affiliateId) {
          throw new BadRequestError('Invitación de afiliado inválida: falta el ID del afiliado')
        }

        // Verify affiliate exists and doesn't have a user linked
        const existingAffiliate = await tx.affiliate.findUnique({
          where: { id: invitation.affiliateId },
          select: { id: true, userId: true },
        })

        if (!existingAffiliate) {
          throw new NotFoundError('Afiliado no encontrado')
        }

        if (existingAffiliate.userId) {
          throw new BadRequestError('Este afiliado ya tiene una cuenta de usuario vinculada')
        }

        // Link affiliate to user
        await tx.affiliate.update({
          where: { id: invitation.affiliateId },
          data: { userId: userId },
        })
        createdEntityId = invitation.affiliateId
        break
      }

      default:
        throw new BadRequestError('Tipo de invitación no válido')
    }

    // Update user's global role
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { globalRoleId: invitation.roleId },
      select: {
        id: true,
        email: true,
        name: true,
        globalRoleId: true,
        globalRole: {
          select: { name: true },
        },
      },
    })

    // Mark invitation as accepted
    await tx.invitation.update({
      where: { id: invitation.id },
      data: {
        status: InvitationStatus.ACCEPTED,
        acceptedAt: now,
      },
    })

    return { updatedUser, entityId: createdEntityId }
  })

  // STEP 8: Log Activity
  logger.info(
    {
      userId,
      invitationId: invitation.id,
      type: invitation.type,
      entityId: result.entityId,
      roleId: invitation.roleId,
    },
    'Invitation accepted successfully'
  )

  // STEP 9: Return Response DTO
  // Note: globalRoleId and globalRole are guaranteed to exist after the update
  // but TypeScript doesn't infer this, so we use fallbacks for safety
  const response: AcceptInvitationResponse = {
    success: true,
    user: {
      id: result.updatedUser.id,
      email: result.updatedUser.email,
      name: result.updatedUser.name,
      globalRoleId: result.updatedUser.globalRoleId ?? invitation.roleId,
      globalRoleName: result.updatedUser.globalRole?.name ?? invitation.role.name,
    },
    type: invitation.type,
    entityId: result.entityId,
    message: getSuccessMessage(invitation.type),
  }

  return response
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get success message based on invitation type
 *
 * @param type - Invitation type
 * @returns Localized success message
 */
function getSuccessMessage(type: InvitationType): string {
  switch (type) {
    case InvitationType.EMPLOYEE:
      return 'Tu cuenta de empleado ha sido activada exitosamente'
    case InvitationType.AGENT:
      return 'Tu cuenta de agente ha sido activada exitosamente'
    case InvitationType.AFFILIATE:
      return 'Tu cuenta de afiliado ha sido activada exitosamente'
    default:
      return 'Tu cuenta ha sido activada exitosamente'
  }
}
