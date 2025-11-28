/**
 * createInsurer.service.ts
 * Service for creating insurers with validation and role-based authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { CreateInsurerResponse } from './createInsurer.dto.js'
import type { CreateInsurerParsed } from './createInsurer.schema.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type (returned from getUserWithContext)
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Create a new insurer
 *
 * Authorization:
 * - BROKER_EMPLOYEES only (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 *
 * Validation:
 * - name must be unique
 * - code must be unique (if provided)
 *
 * @param userId - ID of user creating the insurer
 * @param data - Insurer data from request (validated and parsed by Zod)
 * @returns Created insurer
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role not allowed
 * @throws {ConflictError} If name or code already exists
 */
export async function createInsurer(
  userId: string,
  data: CreateInsurerParsed
): Promise<CreateInsurerResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized insurer creation attempt')
    throw new ForbiddenError('No tienes permiso para crear aseguradoras')
  }

  // STEP 3: Check Uniqueness (pre-check to fail fast)
  const existingChecks: Promise<{ id: string } | null>[] = [
    db.insurer.findUnique({
      where: { name: data.name },
      select: { id: true },
    }),
  ]

  // Only check code uniqueness if provided
  if (data.code) {
    existingChecks.push(
      db.insurer.findUnique({
        where: { code: data.code },
        select: { id: true },
      })
    )
  }

  const [existingByName, existingByCode] = await Promise.all(existingChecks)

  if (existingByName) {
    logger.warn({ userId, name: data.name }, 'Attempted duplicate insurer name')
    throw new ConflictError(`Ya existe una aseguradora con el nombre "${data.name}"`)
  }

  if (existingByCode) {
    logger.warn({ userId, code: data.code }, 'Attempted duplicate insurer code')
    throw new ConflictError(`Ya existe una aseguradora con el código "${data.code}"`)
  }

  // STEP 4: Create Insurer (with race condition handling)
  let insurer
  try {
    insurer = await db.insurer.create({
      data: {
        name: data.name,
        code: data.code ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        website: data.website ?? null,
        billingCutoffDay: data.billingCutoffDay ?? 25,
        isActive: true,
      },
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
    // Handle race condition: P2002 = unique constraint violation
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const target = err.meta?.target as string[] | undefined
        if (target && target.includes('name')) {
          throw new ConflictError(`Ya existe una aseguradora con el nombre "${data.name}"`)
        }
        if (target && target.includes('code')) {
          throw new ConflictError(`Ya existe una aseguradora con el código "${data.code}"`)
        }
      }
    }
    throw err
  }

  // STEP 5: Log Activity
  logger.info(
    {
      userId,
      role: roleName,
      insurerId: insurer.id,
      insurerName: insurer.name,
      insurerCode: insurer.code,
    },
    'Insurer created'
  )

  // STEP 6: Transform to Response DTO
  const response: CreateInsurerResponse = {
    id: insurer.id,
    name: insurer.name,
    code: insurer.code,
    email: insurer.email,
    phone: insurer.phone,
    website: insurer.website,
    billingCutoffDay: insurer.billingCutoffDay,
    isActive: insurer.isActive,
    createdAt: insurer.createdAt.toISOString(),
    updatedAt: insurer.updatedAt.toISOString(),
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
      globalRole: {
        select: { name: true },
      },
    },
  })
}
