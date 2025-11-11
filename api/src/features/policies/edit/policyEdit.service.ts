/**
 * policyEdit.service.ts
 * Service for updating policies with lifecycle validation and role-based authorization
 *
 * Key policies:
 * - BROKER_EMPLOYEES can edit PENDING policies
 * - Only SUPER_ADMIN can edit ACTIVE/EXPIRED/CANCELLED policies
 * - Field editability determined by CURRENT status
 * - Status transitions validated by lifecycle blueprint
 * - All updates logged in audit trail
 * - Atomic updates (policy + audit log in single transaction)
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'
import { PolicyLifecycleValidator } from '../shared/policyLifecycle.validator.js'
import type { PolicyStatus } from '../views/viewPolicies.dto.js'

import type { PolicyUpdateResponse } from './policyEdit.dto.js'
import type { PolicyUpdateParsed } from './policyEdit.schema.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type (simplified for broker-only access)
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Update a policy with lifecycle rules
 *
 * Authorization:
 * - BROKER_EMPLOYEES can edit PENDING policies
 * - Only SUPER_ADMIN can edit ACTIVE/EXPIRED/CANCELLED policies
 * - No resource-level access check needed (broker employees have full access)
 *
 * Validation layers:
 * 1. Zod schema (type, format, constraints)
 * 2. Role-based edit permission (blueprint allowedEditors)
 * 3. Field-level restrictions (blueprint editableFields for current status)
 * 4. Status transition rules (blueprint allowedTransitions)
 * 5. Transition requirements (blueprint transitionRequirements vs merged state)
 *
 * @param userId - ID of the requesting user
 * @param policyId - ID of the policy to update (CUID)
 * @param updates - Parsed updates from Zod (dates are Date objects)
 * @returns Updated policy as PolicyDetailResponse
 * @throws {UnauthorizedError} If user not found
 * @throws {NotFoundError} If policy not found
 * @throws {ForbiddenError} If user role cannot edit this status
 * @throws {BadRequestError} If validation fails (forbidden fields, invalid transition, missing requirements)
 */
export async function updatePolicy(
  userId: string,
  policyId: string,
  updates: PolicyUpdateParsed
): Promise<PolicyUpdateResponse> {
  const validator = new PolicyLifecycleValidator()

  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  const roleName = user.globalRole?.name

  // STEP 2: Load Policy
  const current = await db.policy.findUnique({
    where: { id: policyId },
    select: {
      id: true,
      policyNumber: true,
      status: true,
      type: true,
      ambCopay: true,
      hospCopay: true,
      maternity: true,
      tPremium: true,
      tplus1Premium: true,
      tplusfPremium: true,
      taxRate: true,
      additionalCosts: true,
      startDate: true,
      endDate: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      clientId: true,
      insurerId: true,
    },
  })

  if (!current) {
    throw new NotFoundError('Póliza no encontrada')
  }

  // STEP 3: Role-Based Edit Permission for Current Status
  // Validator checks if user's role is in allowedEditors for current status
  if (!roleName || !validator.canUserEdit(roleName, current.status as PolicyStatus)) {
    logger.warn({ userId, role: roleName, policyStatus: current.status }, 'Unauthorized policy edit attempt')
    throw new ForbiddenError(`No tienes permiso para editar pólizas en estado ${current.status}`)
  }

  // STEP 4: Separate Status from Field Updates
  // Status is handled separately and NOT part of forbidden field checks
  const { status: toStatus, ...fieldUpdates } = updates

  // STEP 5: Validate Field Editability
  // Checks forbidden fields against CURRENT status only (not destination)
  const forbidden = validator.forbiddenFields(
    fieldUpdates as Record<string, unknown>,
    current.status as PolicyStatus
  )

  if (forbidden.length > 0) {
    logger.warn(
      { userId, policyId, policyStatus: current.status, forbiddenFields: forbidden },
      'Attempted to edit forbidden fields'
    )
    throw new BadRequestError(
      `No puedes editar estos campos en estado ${current.status}: ${forbidden.join(', ')}`
    )
  }

  // STEP 6: Validate Status Transition (If Changing)
  if (toStatus && toStatus !== current.status) {
    const canMove = validator.canTransition(
      current.status as PolicyStatus,
      toStatus as PolicyStatus
    )

    if (!canMove) {
      logger.warn(
        { userId, policyId, from: current.status, to: toStatus },
        'Invalid status transition attempt'
      )
      throw new BadRequestError(`No se puede cambiar de ${current.status} a ${toStatus}`)
    }

    // STEP 7: Validate Transition Requirements
    // Requirements validated against MERGED state (current + updates)
    // This allows setting required fields and status in same request
    const missing = validator.missingRequirements(
      current as unknown as Record<string, unknown>,
      updates as unknown as Record<string, unknown>,
      toStatus as PolicyStatus
    )

    if (missing.length > 0) {
      logger.warn(
        { userId, policyId, from: current.status, to: toStatus, missingFields: missing },
        'Missing required fields for transition'
      )
      throw new BadRequestError(
        `Faltan campos requeridos para cambiar a ${toStatus}: ${missing.join(', ')}`
      )
    }
  }

  // STEP 8: Clean Data for Prisma
  // Filter out undefined values (not provided in request)
  // Keep null values (intentional field clearing)
  const dataEntries = Object.entries(updates).filter(([, v]) => v !== undefined)
  const data = Object.fromEntries(dataEntries)

  // STEP 9: Atomic Update + Audit Log (Transaction)
  // Both operations succeed or both fail
  let updated
  try {
    updated = await db.$transaction(async (tx) => {
      // Update policy with relations for DTO transformation
      const updatedPolicy = await tx.policy.update({
        where: { id: policyId },
        data,
        include: {
          client: {
            select: { name: true },
          },
          insurer: {
            select: { name: true },
          },
        },
      })

      // Create audit log with before/after diff
      await tx.auditLog.create({
        data: {
          action: 'POLICY_UPDATED',
          resourceType: 'Policy',
          resourceId: policyId,
          userId,
          clientId: current.clientId,
          changes: {
            before: current,
            after: updatedPolicy,
          },
          metadata: {
            role: roleName,
            statusTransition: toStatus
              ? { from: current.status, to: toStatus }
              : null,
          },
        },
      })

      return updatedPolicy
    })
  } catch (err) {
    // Handle race condition: duplicate policyNumber
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const target = err.meta?.target as string[] | undefined
        if (target && target.includes('policyNumber')) {
          logger.warn(
            { userId, policyId, policyNumber: updates.policyNumber, error: err.code },
            'Duplicate policyNumber detected at database level'
          )
          throw new ConflictError(`Ya existe una póliza con el número ${updates.policyNumber}`)
        }
      }
    }
    // Re-throw unexpected errors
    throw err
  }

  // STEP 10: Transform to DTO and Return
  const response: PolicyUpdateResponse = {
    id: updated.id,
    policyNumber: updated.policyNumber,
    status: updated.status as PolicyUpdateResponse['status'],
    type: updated.type,
    ambCopay: updated.ambCopay,
    hospCopay: updated.hospCopay,
    maternity: updated.maternity,
    tPremium: updated.tPremium,
    tplus1Premium: updated.tplus1Premium,
    tplusfPremium: updated.tplusfPremium,
    taxRate: updated.taxRate,
    additionalCosts: updated.additionalCosts,
    startDate: updated.startDate.toISOString().split('T')[0],
    endDate: updated.endDate.toISOString().split('T')[0],
    isActive: updated.isActive,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    clientId: updated.clientId,
    clientName: updated.client.name,
    insurerId: updated.insurerId,
    insurerName: updated.insurer.name,
  }

  // STEP 11: Log Successful Update
  logger.info(
    { userId, policyId, role: roleName, from: current.status, to: toStatus ?? current.status },
    'Policy updated successfully'
  )

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
      globalRole: {
        select: { name: true },
      },
    },
  })
}
