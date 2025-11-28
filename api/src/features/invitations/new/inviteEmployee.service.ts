/**
 * inviteEmployee.service.ts
 * Service for creating employee invitations with validation and authorization
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

import type { InviteEmployeeResponse } from './inviteEmployee.dto.js'
import type { InviteEmployeeInput } from './inviteEmployee.schema.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** User context type (returned from getUserWithContext) */
interface UserContext {
  id: string
  name: string | null
  globalRole: { name: string } | null
}

/** Invitation expiration in days */
const INVITATION_EXPIRATION_DAYS = 7

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Create a new employee invitation
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE) can invite employees
 * - CLIENT_ADMIN and AFFILIATE cannot invite employees
 *
 * Validation:
 * - Email must not be already registered as a User
 * - No pending invitation can exist for the same email
 * - Role must exist and be active
 * - All required fields validated by Zod schema
 *
 * @param userId - ID of user creating the invitation
 * @param data - Invitation data from request (validated by Zod)
 * @returns Created invitation response
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role not allowed
 * @throws {ConflictError} If email already registered or pending invitation exists
 * @throws {NotFoundError} If role not found
 * @throws {BadRequestError} If role is inactive
 */
export async function inviteEmployee(
  userId: string,
  data: InviteEmployeeInput
): Promise<InviteEmployeeResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (only broker employees)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized employee invitation attempt')
    throw new ForbiddenError('No tienes permiso para invitar empleados')
  }

  // STEP 3: Validate Email Not Already Registered
  const existingUser = await db.user.findUnique({
    where: { email: data.email.toLowerCase() },
    select: { id: true },
  })

  if (existingUser) {
    throw new ConflictError('Este correo electrónico ya está registrado')
  }

  // STEP 4: Validate No Pending Invitation Exists
  const existingInvitation = await db.invitation.findFirst({
    where: {
      email: data.email.toLowerCase(),
      status: InvitationStatus.PENDING,
    },
    select: { id: true },
  })

  if (existingInvitation) {
    throw new ConflictError('Ya existe una invitación pendiente para este correo electrónico')
  }

  // STEP 5: Validate Role Exists and Is Active
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

  // STEP 6: Generate Secure Token (32 bytes = 64 hex characters)
  const token = crypto.randomBytes(32).toString('hex')

  // STEP 7: Calculate Expiration Date
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRATION_DAYS)

  // STEP 8: Prepare Entity Data (stored for employee creation on acceptance)
  const entityData = {
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone ?? null,
    position: data.position ?? null,
    department: data.department ?? null,
    employeeCode: data.employeeCode ?? null,
  }

  // STEP 9: Create Invitation
  const invitation = await db.invitation.create({
    data: {
      email: data.email.toLowerCase(),
      token,
      type: InvitationType.EMPLOYEE,
      status: InvitationStatus.PENDING,
      roleId: data.roleId,
      entityData,
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
    },
  })

  // STEP 10: Send Invitation Email
  const inviteeName = `${data.firstName} ${data.lastName}`
  const inviterName = user.name ?? 'Un administrador'

  try {
    await sendInvitationEmail(
      data.email,
      token,
      'EMPLOYEE',
      inviteeName,
      inviterName
    )
  } catch (error) {
    // Log email failure but don't fail the invitation creation
    logger.error(
      { error, email: data.email, invitationId: invitation.id },
      'Failed to send invitation email'
    )
  }

  // STEP 11: Log Activity
  logger.info(
    {
      userId,
      invitationId: invitation.id,
      email: invitation.email,
      type: invitation.type,
      roleId: invitation.roleId,
    },
    'Employee invitation created'
  )

  // STEP 12: Transform to Response DTO
  const response: InviteEmployeeResponse = {
    id: invitation.id,
    email: invitation.email,
    token: invitation.token,
    type: invitation.type,
    status: invitation.status,
    roleId: invitation.roleId,
    roleName: invitation.role.name,
    entityData: entityData,
    createdById: invitation.createdById,
    createdByName: invitation.createdBy.name,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
  }

  return response
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
