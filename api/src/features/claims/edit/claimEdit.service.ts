/**
 * claimEdit.service.ts
 * Service for updating claims with lifecycle validation and role-based authorization
 *
 * Key policies:
 * - Only SENIOR_CLAIM_MANAGERS and SUPER_ADMIN can edit claims
 * - Field editability determined by CURRENT status (strict two-step workflow)
 * - Status transitions validated by lifecycle blueprint
 * - All updates logged in audit trail
 * - Atomic updates (claim + audit log in single transaction)
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'
import { ClaimLifecycleValidator } from '../shared/claimLifecycle.validator.js'
import type { ClaimStatus } from '../views/viewClaims.dto.js'

import type { ClaimUpdateResponse } from './claimEdit.dto.js'
import type { ClaimUpdateParsed } from './claimEdit.schema.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type (duplicated across services; consider extracting later)
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
  affiliate: { id: string; clientId: string } | null
  clientAccess: { clientId: string }[]
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Update a claim with strict lifecycle rules
 *
 * Authorization:
 * - Only SENIOR_CLAIM_MANAGERS (SUPER_ADMIN, CLAIMS_EMPLOYEE) can edit SUBMITTED/UNDER_REVIEW
 * - Only SUPER_ADMIN can access APPROVED/REJECTED terminal states
 * - No resource-level access check needed (these roles have full claim access)
 * - NOTE: If scoped roles (AFFILIATE, CLIENT_ADMIN) ever gain edit rights,
 *   add resource-level checks (affiliateId, clientId validation)
 *
 * Workflow (strict two-step):
 * - Editable fields are determined by CURRENT status only
 * - When transitioning, only send fields editable in current status + status change
 * - After transition, send fields editable in new status in a second request
 *
 * Validation layers:
 * 1. Zod schema (type, format, constraints)
 * 2. Role-based edit permission (blueprint allowedEditors)
 * 3. Field-level restrictions (blueprint editableFields for current status)
 * 4. Status transition rules (blueprint allowedTransitions)
 * 5. Transition requirements (blueprint transitionRequirements vs merged state)
 *
 * @param userId - ID of the requesting user
 * @param claimId - ID of the claim to update (CUID)
 * @param updates - Parsed updates from Zod (dates are Date objects)
 * @returns Updated claim as ClaimDetailResponse
 * @throws {UnauthorizedError} If user not found
 * @throws {NotFoundError} If claim not found
 * @throws {ForbiddenError} If user role cannot edit this status
 * @throws {BadRequestError} If validation fails (forbidden fields, invalid transition, missing requirements)
 */
export async function updateClaim(
  userId: string,
  claimId: string,
  updates: ClaimUpdateParsed
): Promise<ClaimUpdateResponse> {
  const validator = new ClaimLifecycleValidator()

  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  const roleName = user.globalRole?.name

  // STEP 2: Load Claim
  const current = await db.claim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      claimSequence: true,
      claimNumber: true,
      status: true,
      type: true,
      description: true,
      amount: true,
      approvedAmount: true,
      incidentDate: true,
      submittedDate: true,
      resolvedDate: true,
      createdAt: true,
      updatedAt: true,
      clientId: true,
      affiliateId: true,
      patientId: true,
      policyId: true,
      createdById: true,
    },
  })

  if (!current) {
    throw new NotFoundError('Reclamo no encontrado')
  }

  // STEP 3: Role-Based Edit Permission for Current Status
  // NOTE: Only SENIOR_CLAIM_MANAGERS + SUPER_ADMIN can edit claims.
  // These roles have full claim access, so no resource-level check needed.
  // If AFFILIATE or CLIENT_ADMIN ever gain edit rights, add access control here:
  //   - AFFILIATE: check current.affiliateId === user.affiliate.id
  //   - CLIENT_ADMIN: check current.clientId in user.clientAccess
  if (!roleName || !validator.canUserEdit(roleName, current.status as ClaimStatus)) {
    logger.warn({ userId, role: roleName, claimStatus: current.status }, 'Unauthorized claim edit attempt')
    throw new ForbiddenError(`No tienes permiso para editar reclamos en estado ${current.status}`)
  }

  // STEP 4: Separate Status from Field Updates
  // Status is handled separately and NOT part of forbidden field checks
  const { status: toStatus, ...fieldUpdates } = updates

  // STEP 5: Validate Field Editability (Strict Workflow)
  // Checks forbidden fields against CURRENT status only (not destination)
  // This enforces strict two-step workflow for status transitions
  const forbidden = validator.forbiddenFields(
    fieldUpdates as Record<string, unknown>,
    current.status as ClaimStatus
  )

  if (forbidden.length > 0) {
    logger.warn(
      { userId, claimId, claimStatus: current.status, forbiddenFields: forbidden },
      'Attempted to edit forbidden fields'
    )
    throw new BadRequestError(
      `No puedes editar estos campos en estado ${current.status}: ${forbidden.join(', ')}`
    )
  }

  // STEP 6: Validate Status Transition (If Changing)
  if (toStatus && toStatus !== current.status) {
    const canMove = validator.canTransition(
      current.status as ClaimStatus,
      toStatus as ClaimStatus
    )

    if (!canMove) {
      logger.warn(
        { userId, claimId, from: current.status, to: toStatus },
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
      toStatus as ClaimStatus
    )

    if (missing.length > 0) {
      logger.warn(
        { userId, claimId, from: current.status, to: toStatus, missingFields: missing },
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
  const updated = await db.$transaction(async (tx) => {
    // Update claim with all relations for DTO transformation
    const updatedClaim = await tx.claim.update({
      where: { id: claimId },
      data,
      include: {
        client: {
          select: { name: true },
        },
        affiliate: {
          select: { firstName: true, lastName: true },
        },
        patient: {
          select: { firstName: true, lastName: true },
        },
        policy: {
          select: { policyNumber: true },
        },
        createdBy: {
          select: { name: true },
        },
      },
    })

    // Create audit log with before/after diff
    await tx.auditLog.create({
      data: {
        action: 'CLAIM_UPDATED',
        resourceType: 'Claim',
        resourceId: claimId,
        userId,
        clientId: current.clientId,
        changes: {
          before: current,
          after: updatedClaim,
        },
        metadata: {
          role: roleName,
          statusTransition: toStatus
            ? { from: current.status, to: toStatus }
            : null,
        },
      },
    })

    return updatedClaim
  })

  // STEP 10: Transform to DTO and Return
  // Convert dates to ISO strings and calculate patientRelationship
  const response: ClaimUpdateResponse = {
    id: updated.id,
    claimSequence: updated.claimSequence,
    claimNumber: updated.claimNumber,
    status: updated.status as ClaimUpdateResponse['status'],
    type: updated.type,
    description: updated.description,
    amount: updated.amount,
    approvedAmount: updated.approvedAmount,
    incidentDate: updated.incidentDate?.toISOString().split('T')[0] ?? null,
    submittedDate: updated.submittedDate?.toISOString().split('T')[0] ?? null,
    resolvedDate: updated.resolvedDate?.toISOString().split('T')[0] ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    clientId: updated.clientId,
    clientName: updated.client.name,
    affiliateId: updated.affiliateId,
    affiliateFirstName: updated.affiliate.firstName,
    affiliateLastName: updated.affiliate.lastName,
    patientId: updated.patientId,
    patientFirstName: updated.patient.firstName,
    patientLastName: updated.patient.lastName,
    patientRelationship: updated.patientId === updated.affiliateId ? 'self' : 'dependent',
    policyId: updated.policyId,
    policyNumber: updated.policy?.policyNumber ?? null,
    createdById: updated.createdById,
    createdByName: updated.createdBy.name,
  }

  // Log successful update
  logger.info(
    { userId, claimId, role: roleName, from: current.status, to: toStatus ?? current.status },
    'Claim updated successfully'
  )

  return response
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with role, affiliate, and client access context for authorization
 *
 * @param userId - User ID to load
 * @returns UserContext or null if not found
 */
async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      globalRole: {
        select: { name: true },
      },
      affiliate: {
        select: { id: true, clientId: true },
      },
      clientAccess: {
        where: { isActive: true },
        select: { clientId: true },
      },
    },
  })
}
