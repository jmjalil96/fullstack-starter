/**
 * insurerDetail.service.ts
 * Service for getting insurer details with role-based authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { InsurerDetailResponse } from './insurerDetail.dto.js'

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
 * Get insurer details by ID
 *
 * Role-based authorization:
 * - BROKER_EMPLOYEES only: Can view any insurer
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden (admin feature)
 *
 * @param userId - ID of user requesting insurer details
 * @param insurerId - ID of the insurer to retrieve
 * @returns Complete insurer details
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role cannot view insurers
 * @throws {NotFoundError} If insurer not found
 */
export async function getInsurerById(
  userId: string,
  insurerId: string
): Promise<InsurerDetailResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (BROKER_EMPLOYEES only)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName, insurerId }, 'Unauthorized insurer detail access attempt')
    throw new ForbiddenError('No tienes permiso para ver aseguradoras')
  }

  // STEP 3: Load Insurer
  const insurer = await db.insurer.findUnique({
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
  if (!insurer) {
    logger.warn({ userId, insurerId }, 'Insurer not found')
    throw new NotFoundError('Aseguradora no encontrada')
  }

  // STEP 5: Transform to Response DTO
  const response: InsurerDetailResponse = {
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

  // STEP 6: Log Activity
  logger.info(
    {
      userId,
      role: roleName,
      insurerId,
      insurerName: insurer.name,
    },
    'Insurer detail retrieved'
  )

  // STEP 7: Return Response
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
