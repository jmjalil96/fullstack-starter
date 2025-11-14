/**
 * affiliateEdit.service.ts
 * Service for updating affiliates with validation and role-based authorization
 *
 * Much simpler than claim editing:
 * - No lifecycle state machine
 * - All fields editable anytime
 * - BROKER_EMPLOYEES only (no resource-level access needed)
 * - Cross-field validation for affiliateType changes
 * - documentNumber uniqueness validation needed
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { UpdateAffiliateResponse } from './affiliateEdit.dto.js'
import type { UpdateAffiliateParsed } from './affiliateEdit.schema.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type (duplicated across services; consider extracting later)
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Update an affiliate with partial updates
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE) can edit
 * - CLIENT_ADMIN and AFFILIATE have read-only access
 * - No resource-level access check needed (broker employees can edit any affiliate)
 *
 * Validation:
 * - documentNumber uniqueness if changed
 * - At least one field must be provided (Zod superRefine)
 * - Contact fields (email, phone, documentType, documentNumber, dateOfBirth, coverageType, primaryAffiliateId) can be set to null to clear
 *
 * Cross-field validation for affiliateType:
 * - If changing to OWNER: email must be present (finalEmail check), primaryAffiliateId must be null
 * - If changing to DEPENDENT: primaryAffiliateId must be present
 * - If updating primaryAffiliateId: must exist, be OWNER type, same client, and active
 *
 * @param userId - ID of the requesting user
 * @param affiliateId - ID of the affiliate to update (CUID)
 * @param updates - Parsed updates from Zod
 * @returns Updated affiliate as AffiliateDetailResponse
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role cannot edit affiliates
 * @throws {NotFoundError} If affiliate not found
 * @throws {BadRequestError} If updates are empty or cross-field validation fails
 * @throws {ConflictError} If documentNumber already exists
 */
export async function updateAffiliate(
  userId: string,
  affiliateId: string,
  updates: UpdateAffiliateParsed
): Promise<UpdateAffiliateResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (only broker employees)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName, affiliateId }, 'Unauthorized affiliate edit attempt')
    throw new ForbiddenError('No tienes permiso para editar afiliados')
  }

  // STEP 3: Load Current Affiliate
  const currentAffiliate = await db.affiliate.findUnique({
    where: { id: affiliateId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      documentType: true,
      documentNumber: true,
      affiliateType: true,
      coverageType: true,
      userId: true,
      isActive: true,
      clientId: true,
      primaryAffiliateId: true,
      createdAt: true,
      updatedAt: true,
      client: {
        select: {
          id: true,
          name: true,
        },
      },
      primaryAffiliate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  // STEP 4: Validate Affiliate Exists
  if (!currentAffiliate) {
    logger.warn({ userId, affiliateId }, 'Affiliate not found for update')
    throw new NotFoundError('Afiliado no encontrado')
  }

  // STEP 5: Filter Updates (remove undefined, keep null)
  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  )

  // STEP 6: Validate Non-Empty Update (redundant with Zod superRefine, but defensive)
  if (Object.keys(filteredUpdates).length === 0) {
    throw new BadRequestError('Debe proporcionar al menos un campo para actualizar')
  }

  // STEP 7: Cross-Field Validation
  // Determine final affiliateType (use update if provided, otherwise current)
  const finalAffiliateType = updates.affiliateType ?? currentAffiliate.affiliateType

  // Determine final email (use update if provided, otherwise current)
  // Note: updates.email can be null (to clear), undefined (not updating), or string (new value)
  const finalEmail =
    updates.email !== undefined ? updates.email : currentAffiliate.email

  // Determine final primaryAffiliateId (use update if provided, otherwise current)
  const finalPrimaryAffiliateId =
    updates.primaryAffiliateId !== undefined
      ? updates.primaryAffiliateId
      : currentAffiliate.primaryAffiliateId

  // Rule 1: OWNER affiliates must have email
  if (finalAffiliateType === 'OWNER' && !finalEmail) {
    throw new BadRequestError(
      'Los afiliados de tipo OWNER deben tener un correo electrónico'
    )
  }

  // Rule 2: DEPENDENT affiliates must have primaryAffiliateId
  if (finalAffiliateType === 'DEPENDENT' && !finalPrimaryAffiliateId) {
    throw new BadRequestError(
      'Los afiliados de tipo DEPENDENT deben tener un afiliado principal (primaryAffiliateId)'
    )
  }

  // Rule 3: OWNER affiliates must NOT have primaryAffiliateId
  if (finalAffiliateType === 'OWNER' && finalPrimaryAffiliateId) {
    throw new BadRequestError(
      'Los afiliados de tipo OWNER no pueden tener un afiliado principal (primaryAffiliateId)'
    )
  }

  // Rule 4: If updating primaryAffiliateId, validate it exists, is OWNER, same client, and active
  if (
    updates.primaryAffiliateId !== undefined &&
    updates.primaryAffiliateId !== null
  ) {
    const primaryAffiliate = await db.affiliate.findUnique({
      where: { id: updates.primaryAffiliateId },
      select: {
        id: true,
        affiliateType: true,
        clientId: true,
        isActive: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!primaryAffiliate) {
      throw new NotFoundError('Afiliado principal no encontrado')
    }

    if (primaryAffiliate.affiliateType !== 'OWNER') {
      throw new BadRequestError(
        'El afiliado principal debe ser de tipo OWNER'
      )
    }

    if (primaryAffiliate.clientId !== currentAffiliate.clientId) {
      throw new BadRequestError(
        'El afiliado principal debe pertenecer al mismo cliente'
      )
    }

    if (!primaryAffiliate.isActive) {
      throw new BadRequestError(
        'El afiliado principal debe estar activo'
      )
    }
  }

  // STEP 8: Validate documentNumber Uniqueness (if changed)
  if (
    updates.documentNumber !== undefined &&
    updates.documentNumber !== null &&
    updates.documentNumber !== currentAffiliate.documentNumber
  ) {
    const existingAffiliate = await db.affiliate.findFirst({
      where: {
        documentNumber: updates.documentNumber,
        id: { not: affiliateId },
      },
      select: { id: true, firstName: true, lastName: true },
    })

    if (existingAffiliate) {
      logger.warn(
        {
          userId,
          affiliateId,
          newDocumentNumber: updates.documentNumber,
          existingAffiliateId: existingAffiliate.id,
        },
        'Attempted to update to duplicate documentNumber'
      )
      throw new ConflictError(
        `Ya existe un afiliado con el número de documento ${updates.documentNumber}`
      )
    }
  }

  // STEP 9: Update Affiliate (with race condition handling)
  let updatedAffiliate
  try {
    updatedAffiliate = await db.affiliate.update({
      where: { id: affiliateId },
      data: filteredUpdates,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        documentType: true,
        documentNumber: true,
        affiliateType: true,
        coverageType: true,
        userId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        clientId: true,
        primaryAffiliateId: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        primaryAffiliate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  } catch (err) {
    // Handle race condition: another request updated to same documentNumber
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const target = err.meta?.target as string[] | undefined
        if (target && target.includes('documentNumber')) {
          logger.warn(
            {
              userId,
              affiliateId,
              newDocumentNumber: updates.documentNumber,
              error: err.code,
            },
            'Race condition: duplicate documentNumber detected at database level'
          )
          throw new ConflictError(
            `Ya existe un afiliado con el número de documento ${updates.documentNumber}`
          )
        }
      }
    }
    // Re-throw unexpected errors
    throw err
  }

  // STEP 10: Transform to Response DTO
  const response: UpdateAffiliateResponse = {
    id: updatedAffiliate.id,
    firstName: updatedAffiliate.firstName,
    lastName: updatedAffiliate.lastName,
    email: updatedAffiliate.email,
    phone: updatedAffiliate.phone,
    dateOfBirth: updatedAffiliate.dateOfBirth?.toISOString().split('T')[0] ?? null,
    documentType: updatedAffiliate.documentType,
    documentNumber: updatedAffiliate.documentNumber,
    affiliateType: updatedAffiliate.affiliateType,
    coverageType: updatedAffiliate.coverageType,
    hasUserAccount: updatedAffiliate.userId !== null,
    isActive: updatedAffiliate.isActive,
    createdAt: updatedAffiliate.createdAt.toISOString(),
    updatedAt: updatedAffiliate.updatedAt.toISOString(),
    clientId: updatedAffiliate.clientId,
    clientName: updatedAffiliate.client.name,
    primaryAffiliateId: updatedAffiliate.primaryAffiliateId,
    primaryAffiliateFirstName: updatedAffiliate.primaryAffiliate?.firstName ?? null,
    primaryAffiliateLastName: updatedAffiliate.primaryAffiliate?.lastName ?? null,
  }

  // STEP 11: Log Activity
  logger.info(
    {
      userId,
      role: roleName,
      affiliateId,
      affiliateName: `${updatedAffiliate.firstName} ${updatedAffiliate.lastName}`,
      clientId: updatedAffiliate.clientId,
      clientName: updatedAffiliate.client.name,
      updatedFields: Object.keys(filteredUpdates),
    },
    'Affiliate updated'
  )

  // STEP 12: Return Response
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
