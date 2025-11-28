/**
 * claimEdit.service.ts
 * Service for updating claims with lifecycle validation and role-based authorization
 *
 * Key policies:
 * - Only SENIOR_CLAIM_MANAGERS and SUPER_ADMIN can edit claims
 * - Field editability determined by CURRENT status (strict two-step workflow)
 * - Status transitions validated by lifecycle blueprint
 * - PENDING_INFO → SUBMITTED creates ClaimReprocess record
 * - All updates logged in audit trail
 * - Atomic updates (claim + audit log + reprocess in single transaction)
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
import {
  CLAIM_LIFECYCLE_BLUEPRINT,
  type ClaimLifecycleState,
} from '../shared/claimLifecycle.blueprint.js'
import { ClaimLifecycleValidator } from '../shared/claimLifecycle.validator.js'
import { getClaimById } from '../views/claimDetail.service.js'

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
 * - Only SENIOR_CLAIM_MANAGERS (SUPER_ADMIN, CLAIMS_EMPLOYEE) can edit non-terminal states
 * - Only SUPER_ADMIN can access terminal states (RETURNED, SETTLED, CANCELLED)
 * - No resource-level access check needed (these roles have full claim access)
 *
 * Workflow (strict two-step):
 * - Editable fields are determined by CURRENT status only
 * - When transitioning, only send fields editable in current status + status change
 * - After transition, send fields editable in new status in a second request
 *
 * Special transitions:
 * - PENDING_INFO → SUBMITTED: Creates ClaimReprocess record with reprocessDate/Description
 * - SUBMITTED → SETTLED: Requires all settlement fields
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
      description: true,
      careType: true,
      diagnosisCode: true,
      diagnosisDescription: true,
      amountSubmitted: true,
      amountApproved: true,
      amountDenied: true,
      amountUnprocessed: true,
      deductibleApplied: true,
      copayApplied: true,
      incidentDate: true,
      submittedDate: true,
      settlementDate: true,
      businessDays: true,
      settlementNumber: true,
      settlementNotes: true,
      createdAt: true,
      updatedAt: true,
      clientId: true,
      affiliateId: true,
      patientId: true,
      policyId: true,
      createdById: true,
      updatedById: true,
    },
  })

  if (!current) {
    throw new NotFoundError('Reclamo no encontrado')
  }

  // STEP 3: Role-Based Edit Permission for Current Status
  if (!roleName || !validator.canUserEdit(roleName, current.status as ClaimLifecycleState)) {
    logger.warn({ userId, role: roleName, claimStatus: current.status }, 'Unauthorized claim edit attempt')
    throw new ForbiddenError(`No tienes permiso para editar reclamos en estado ${current.status}`)
  }

  // STEP 4: Separate Status and Reprocess Fields from Field Updates
  const { status: toStatus, reprocessDate, reprocessDescription, ...fieldUpdates } = updates

  // STEP 5: Determine if we're transitioning status
  const isTransitioning = toStatus && toStatus !== current.status
  const isPendingInfoToSubmitted =
    isTransitioning && current.status === 'PENDING_INFO' && toStatus === 'SUBMITTED'

  // STEP 6: Validate Field Editability (Strict Workflow)
  // When transitioning, exclude transition requirement fields from forbidden check
  let forbidden = validator.forbiddenFields(
    fieldUpdates as Record<string, unknown>,
    current.status as ClaimLifecycleState
  )

  // If transitioning, get the transition requirements and allow those fields
  if (isTransitioning && forbidden.length > 0) {
    const fromStatus = current.status as ClaimLifecycleState
    const rules = CLAIM_LIFECYCLE_BLUEPRINT[fromStatus]
    const transitionReqs =
      rules?.transitionRequirements[toStatus as keyof typeof rules.transitionRequirements] || []
    const allowedForTransition = transitionReqs as readonly string[]

    // Filter out fields that are allowed for this transition
    forbidden = forbidden.filter((field) => !allowedForTransition.includes(field))
  }

  if (forbidden.length > 0) {
    logger.warn(
      { userId, claimId, claimStatus: current.status, forbiddenFields: forbidden },
      'Attempted to edit forbidden fields'
    )
    throw new BadRequestError(
      `No puedes editar estos campos en estado ${current.status}: ${forbidden.join(', ')}`
    )
  }

  // STEP 7: Validate Status Transition (If Changing)

  if (isTransitioning) {
    const canMove = validator.canTransition(
      current.status as ClaimLifecycleState,
      toStatus as ClaimLifecycleState
    )

    if (!canMove) {
      logger.warn(
        { userId, claimId, from: current.status, to: toStatus },
        'Invalid status transition attempt'
      )
      throw new BadRequestError(`No se puede cambiar de ${current.status} a ${toStatus}`)
    }

    // STEP 8: Validate Transition Requirements
    // For PENDING_INFO → SUBMITTED, include reprocessDate and reprocessDescription in merged state
    const updatesForValidation = isPendingInfoToSubmitted
      ? { ...updates, reprocessDate, reprocessDescription }
      : updates

    const missing = validator.missingRequirements(
      current as unknown as Record<string, unknown>,
      updatesForValidation as unknown as Record<string, unknown>,
      toStatus as ClaimLifecycleState
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

  // STEP 9: Clean Data for Prisma
  // Filter out undefined values (not provided in request)
  // Keep null values (intentional field clearing)
  // Remove reprocessDate/Description as they go to ClaimReprocess
  const { reprocessDate: _, reprocessDescription: __, ...cleanUpdates } = updates
  const dataEntries = Object.entries(cleanUpdates).filter(([, v]) => v !== undefined)
  const data = Object.fromEntries(dataEntries) as Record<string, unknown>

  // Always update updatedById
  data.updatedById = userId

  // STEP 10: Atomic Update + Audit Log + ClaimReprocess (Transaction)
  await db.$transaction(async (tx) => {
    // Create ClaimReprocess record if PENDING_INFO → SUBMITTED
    if (isPendingInfoToSubmitted && reprocessDate && reprocessDescription) {
      await tx.claimReprocess.create({
        data: {
          claimId,
          reprocessDate: reprocessDate,
          reprocessDescription: reprocessDescription,
          businessDays: (fieldUpdates.businessDays as number | null | undefined) ?? null,
          createdById: userId,
        },
      })

      logger.info(
        { userId, claimId, reprocessDate, reprocessDescription },
        'ClaimReprocess record created'
      )
    }

    // Update claim
    await tx.claim.update({
      where: { id: claimId },
      data,
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
          after: { ...current, ...data },
        },
        metadata: {
          role: roleName,
          statusTransition: isTransitioning ? { from: current.status, to: toStatus } : null,
          reprocessCreated: isPendingInfoToSubmitted,
        },
      },
    })
  })

  // STEP 10: Fetch and Return Updated Claim Detail
  // Use the existing getClaimById service for consistent response
  const response = await getClaimById(userId, claimId)

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
