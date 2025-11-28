/**
 * insurerEdit.service.ts
 * Service for updating insurers with validation and role-based authorization
 *
 * Simple entity:
 * - No lifecycle state machine
 * - All fields editable anytime
 * - BROKER_EMPLOYEES only
 * - name/code uniqueness validation
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

import type { UpdateInsurerResponse } from './insurerEdit.dto.js'
import type { UpdateInsurerParsed } from './insurerEdit.schema.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Update an insurer with partial updates
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE) can edit
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 *
 * Validation:
 * - name uniqueness if changed
 * - code uniqueness if changed
 * - At least one field must be provided (Zod superRefine)
 *
 * @param userId - ID of the requesting user
 * @param insurerId - ID of the insurer to update (CUID)
 * @param updates - Parsed updates from Zod
 * @returns Updated insurer as InsurerDetailResponse
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role cannot edit insurers
 * @throws {NotFoundError} If insurer not found
 * @throws {BadRequestError} If updates are empty
 * @throws {ConflictError} If name or code already exists
 */
export async function updateInsurer(
  userId: string,
  insurerId: string,
  updates: UpdateInsurerParsed
): Promise<UpdateInsurerResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (only broker employees)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName, insurerId }, 'Unauthorized insurer edit attempt')
    throw new ForbiddenError('No tienes permiso para editar aseguradoras')
  }

  // STEP 3: Load Current Insurer
  const currentInsurer = await db.insurer.findUnique({
    where: { id: insurerId },
    select: {
      id: true,
      name: true,
      code: true,
      email: true,
      phone: true,
      website: true,
      billingCutoffDay: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  // STEP 4: Validate Insurer Exists
  if (!currentInsurer) {
    logger.warn({ userId, insurerId }, 'Insurer not found for update')
    throw new NotFoundError('Aseguradora no encontrada')
  }

  // STEP 5: Filter Updates (remove undefined, keep null)
  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  )

  // STEP 6: Validate Non-Empty Update (redundant with Zod superRefine, but defensive)
  if (Object.keys(filteredUpdates).length === 0) {
    throw new BadRequestError('Debe proporcionar al menos un campo para actualizar')
  }

  // STEP 7: Validate Name Uniqueness (if changed)
  if (
    updates.name !== undefined &&
    updates.name !== currentInsurer.name
  ) {
    const existingByName = await db.insurer.findUnique({
      where: { name: updates.name },
      select: { id: true },
    })

    if (existingByName) {
      logger.warn(
        {
          userId,
          insurerId,
          newName: updates.name,
          existingInsurerId: existingByName.id,
        },
        'Attempted to update to duplicate name'
      )
      throw new ConflictError(`Ya existe una aseguradora con el nombre "${updates.name}"`)
    }
  }

  // STEP 8: Validate Code Uniqueness (if changed and not null)
  if (
    updates.code !== undefined &&
    updates.code !== null &&
    updates.code !== currentInsurer.code
  ) {
    const existingByCode = await db.insurer.findUnique({
      where: { code: updates.code },
      select: { id: true },
    })

    if (existingByCode) {
      logger.warn(
        {
          userId,
          insurerId,
          newCode: updates.code,
          existingInsurerId: existingByCode.id,
        },
        'Attempted to update to duplicate code'
      )
      throw new ConflictError(`Ya existe una aseguradora con el código "${updates.code}"`)
    }
  }

  // STEP 9: Update Insurer (with race condition handling)
  let updatedInsurer
  try {
    updatedInsurer = await db.insurer.update({
      where: { id: insurerId },
      data: filteredUpdates,
      select: {
        id: true,
        name: true,
        code: true,
        email: true,
        phone: true,
        website: true,
        billingCutoffDay: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  } catch (err) {
    // Handle race condition: another request updated to same name/code
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const target = err.meta?.target as string[] | undefined
        if (target && target.includes('name')) {
          logger.warn(
            {
              userId,
              insurerId,
              newName: updates.name,
              error: err.code,
            },
            'Race condition: duplicate name detected at database level'
          )
          throw new ConflictError(`Ya existe una aseguradora con el nombre "${updates.name}"`)
        }
        if (target && target.includes('code')) {
          logger.warn(
            {
              userId,
              insurerId,
              newCode: updates.code,
              error: err.code,
            },
            'Race condition: duplicate code detected at database level'
          )
          throw new ConflictError(`Ya existe una aseguradora con el código "${updates.code}"`)
        }
      }
    }
    // Re-throw unexpected errors
    throw err
  }

  // STEP 10: Transform to Response DTO
  const response: UpdateInsurerResponse = {
    id: updatedInsurer.id,
    name: updatedInsurer.name,
    code: updatedInsurer.code,
    email: updatedInsurer.email,
    phone: updatedInsurer.phone,
    website: updatedInsurer.website,
    billingCutoffDay: updatedInsurer.billingCutoffDay,
    isActive: updatedInsurer.isActive,
    createdAt: updatedInsurer.createdAt.toISOString(),
    updatedAt: updatedInsurer.updatedAt.toISOString(),
  }

  // STEP 11: Log Activity
  logger.info(
    {
      userId,
      role: roleName,
      insurerId,
      insurerName: updatedInsurer.name,
      updatedFields: Object.keys(filteredUpdates),
    },
    'Insurer updated'
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
