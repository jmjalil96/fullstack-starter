/**
 * inviteAffiliate.service.ts
 * Service for creating affiliate invitations with validation and authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import crypto from 'crypto'

import { InvitationStatus, InvitationType } from '@prisma/client'

import { db } from '../../../config/database.js'
import { sendInvitationEmail } from '../../../lib/email.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type {
  BulkInviteResult,
  InviteAffiliateResponse,
  InviteAffiliatesBulkResponse,
} from './inviteAffiliate.dto.js'
import type { InviteAffiliateInput, InviteAffiliatesBulkInput } from './inviteAffiliate.schema.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** User context type (returned from getUserWithContext) */
interface UserContext {
  id: string
  name: string | null
  globalRole: { name: string } | null
  clientAccess: { clientId: string }[]
}

/** Invitation expiration in days */
const INVITATION_EXPIRATION_DAYS = 7

// ============================================================================
// MAIN SERVICE FUNCTIONS
// ============================================================================

/**
 * Create a new affiliate invitation
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can invite any affiliate
 * - CLIENT_ADMIN: Can only invite affiliates from accessible clients
 * - AFFILIATE: Cannot invite (403 Forbidden)
 *
 * Validation:
 * - Affiliate must exist
 * - Affiliate must have an email
 * - Affiliate must not already have a userId (not linked to user)
 * - No pending invitation can exist for this affiliate
 * - Role must exist and be active
 *
 * @param userId - ID of user creating the invitation
 * @param data - Invitation data from request (validated by Zod)
 * @returns Created invitation response
 */
export async function inviteAffiliate(
  userId: string,
  data: InviteAffiliateInput
): Promise<InviteAffiliateResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name
  const isBrokerEmployee = roleName ? BROKER_EMPLOYEES.includes(roleName as never) : false
  const isClientAdmin = roleName === 'CLIENT_ADMIN'

  if (!isBrokerEmployee && !isClientAdmin) {
    logger.warn({ userId, role: roleName }, 'Unauthorized affiliate invitation attempt')
    throw new ForbiddenError('No tienes permiso para invitar afiliados')
  }

  // STEP 3: Find Affiliate
  const affiliate = await db.affiliate.findUnique({
    where: { id: data.affiliateId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      userId: true,
      isActive: true,
      clientId: true,
    },
  })

  if (!affiliate) {
    throw new NotFoundError('Afiliado no encontrado')
  }

  // STEP 4: CLIENT_ADMIN Access Check
  if (isClientAdmin) {
    const hasAccess = user.clientAccess.some((uc) => uc.clientId === affiliate.clientId)
    if (!hasAccess) {
      logger.warn(
        { userId, affiliateId: data.affiliateId, clientId: affiliate.clientId },
        'CLIENT_ADMIN attempted to invite affiliate from inaccessible client'
      )
      throw new ForbiddenError('No tienes acceso a este afiliado')
    }
  }

  // STEP 5: Validate Affiliate Has Email
  if (!affiliate.email) {
    throw new BadRequestError('El afiliado no tiene correo electrónico registrado')
  }

  // STEP 6: Validate Affiliate Not Already Linked
  if (affiliate.userId) {
    throw new BadRequestError('Este afiliado ya tiene una cuenta de usuario vinculada')
  }

  // STEP 7: Validate Affiliate Is Active
  if (!affiliate.isActive) {
    throw new BadRequestError('No se puede invitar a un afiliado inactivo')
  }

  // STEP 8: Validate No Pending Invitation Exists
  const existingInvitation = await db.invitation.findFirst({
    where: {
      affiliateId: data.affiliateId,
      status: InvitationStatus.PENDING,
    },
    select: { id: true },
  })

  if (existingInvitation) {
    throw new ConflictError('Ya existe una invitación pendiente para este afiliado')
  }

  // STEP 9: Validate Role Exists and Is Active
  const role = await db.role.findUnique({
    where: { id: data.roleId },
    select: { id: true, name: true, isActive: true },
  })

  if (!role) {
    throw new NotFoundError('Rol no encontrado')
  }

  if (!role.isActive) {
    throw new BadRequestError('El rol seleccionado está inactivo')
  }

  // STEP 10: Generate Secure Token (32 bytes = 64 hex characters)
  const token = crypto.randomBytes(32).toString('hex')

  // STEP 11: Calculate Expiration Date
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRATION_DAYS)

  // STEP 12: Create Invitation
  const invitation = await db.invitation.create({
    data: {
      email: affiliate.email.toLowerCase(),
      token,
      type: InvitationType.AFFILIATE,
      status: InvitationStatus.PENDING,
      roleId: data.roleId,
      affiliateId: data.affiliateId,
      expiresAt,
      createdById: userId,
    },
    include: {
      role: {
        select: { name: true },
      },
      createdBy: {
        select: { name: true },
      },
      affiliate: {
        select: { firstName: true, lastName: true },
      },
    },
  })

  // STEP 13: Send Invitation Email
  const inviteeName = `${affiliate.firstName} ${affiliate.lastName}`
  const inviterName = user.name ?? 'Un administrador'

  try {
    await sendInvitationEmail(
      affiliate.email,
      token,
      'AFFILIATE',
      inviteeName,
      inviterName
    )
  } catch (error) {
    logger.error(
      { error, email: affiliate.email, invitationId: invitation.id },
      'Failed to send invitation email'
    )
  }

  // STEP 14: Log Activity
  logger.info(
    {
      userId,
      invitationId: invitation.id,
      affiliateId: data.affiliateId,
      email: invitation.email,
      type: invitation.type,
      roleId: invitation.roleId,
    },
    'Affiliate invitation created'
  )

  // STEP 15: Transform to Response DTO
  return {
    id: invitation.id,
    email: invitation.email,
    token: invitation.token,
    type: invitation.type,
    status: invitation.status,
    roleId: invitation.roleId,
    roleName: invitation.role.name,
    affiliateId: invitation.affiliateId ?? '',
    affiliateFirstName: invitation.affiliate?.firstName ?? '',
    affiliateLastName: invitation.affiliate?.lastName ?? '',
    createdById: invitation.createdById,
    createdByName: invitation.createdBy.name,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
  }
}

/**
 * Bulk invite multiple affiliates
 *
 * Processes each affiliate individually, continuing on failures.
 * Returns partial success: { success: [], failed: [{ id, reason }] }
 *
 * @param userId - ID of user creating invitations
 * @param data - Bulk invitation data
 * @returns Bulk response with individual results
 */
export async function inviteAffiliatesBulk(
  userId: string,
  data: InviteAffiliatesBulkInput
): Promise<InviteAffiliatesBulkResponse> {
  const results: BulkInviteResult[] = []

  // Process each affiliate individually
  for (const affiliateId of data.affiliateIds) {
    try {
      const invitation = await inviteAffiliate(userId, {
        affiliateId,
        roleId: data.roleId,
      })

      results.push({
        affiliateId,
        success: true,
        invitationId: invitation.id,
        reason: null,
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Error desconocido'

      results.push({
        affiliateId,
        success: false,
        invitationId: null,
        reason,
      })

      logger.warn(
        { userId, affiliateId, error: reason },
        'Failed to invite affiliate in bulk operation'
      )
    }
  }

  const successCount = results.filter((r) => r.success).length
  const failedCount = results.filter((r) => !r.success).length

  logger.info(
    {
      userId,
      total: data.affiliateIds.length,
      successCount,
      failedCount,
    },
    'Bulk affiliate invitation completed'
  )

  return {
    total: data.affiliateIds.length,
    successCount,
    failedCount,
    results,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with all context needed for authorization
 *
 * @param userId - User ID to load
 * @returns User with role and client access data
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
      clientAccess: {
        where: { isActive: true },
        select: { clientId: true },
      },
    },
  })
}
