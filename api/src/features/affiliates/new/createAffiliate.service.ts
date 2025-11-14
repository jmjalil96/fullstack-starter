/**
 * createAffiliate.service.ts
 * Service for creating new affiliates with validation and authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { CreateAffiliateResponse } from './createAffiliate.dto.js'
import type { CreateAffiliateInput } from './createAffiliate.schema.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// User context type (returned from getUserWithContext)
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Create a new affiliate
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE) can create affiliates
 * - CLIENT_ADMIN and AFFILIATE cannot create affiliates
 *
 * Validation:
 * - Client must exist and be active
 * - For DEPENDENT affiliates: primaryAffiliate must exist, be OWNER type, be active, and belong to same client
 * - All required fields validated by Zod schema
 * - dateOfBirth converted to ISO date-only string format
 *
 * @param userId - ID of user creating the affiliate
 * @param data - Affiliate data from request (validated by Zod)
 * @returns Created affiliate
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role not allowed
 * @throws {NotFoundError} If client or primaryAffiliate not found
 * @throws {BadRequestError} If client inactive, primaryAffiliate not OWNER, primaryAffiliate inactive, or primaryAffiliate belongs to different client
 */
export async function createAffiliate(
  userId: string,
  data: CreateAffiliateInput
): Promise<CreateAffiliateResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (only broker employees)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized affiliate creation attempt')
    throw new ForbiddenError('No tienes permiso para crear afiliados')
  }

  // STEP 3: Validate Related Entities
  // 3.1: Validate Client
  const client = await db.client.findUnique({
    where: { id: data.clientId },
    select: { id: true, name: true, isActive: true },
  })

  if (!client) {
    throw new NotFoundError('Cliente no encontrado')
  }

  if (!client.isActive) {
    throw new BadRequestError('Cliente inactivo')
  }

  // 3.2: If DEPENDENT, validate Primary Affiliate
  if (data.affiliateType === 'DEPENDENT') {
    if (!data.primaryAffiliateId) {
      throw new BadRequestError('Afiliado principal es requerido para dependientes')
    }

    const primaryAffiliate = await db.affiliate.findUnique({
      where: { id: data.primaryAffiliateId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        affiliateType: true,
        isActive: true,
        clientId: true,
      },
    })

    if (!primaryAffiliate) {
      throw new NotFoundError('Afiliado principal no encontrado')
    }

    if (primaryAffiliate.affiliateType !== 'OWNER') {
      throw new BadRequestError('El afiliado principal debe ser un titular (OWNER)')
    }

    if (!primaryAffiliate.isActive) {
      throw new BadRequestError('Afiliado principal inactivo')
    }

    if (primaryAffiliate.clientId !== data.clientId) {
      throw new BadRequestError('El afiliado principal debe pertenecer al mismo cliente')
    }
  }

  // STEP 4: Create Affiliate
  const affiliate = await db.affiliate.create({
      data: {
        clientId: data.clientId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone ?? null,
        dateOfBirth: data.dateOfBirth ?? null,
        documentType: data.documentType ?? null,
        documentNumber: data.documentNumber ?? null,
        affiliateType: data.affiliateType,
        coverageType: data.coverageType ?? null,
        primaryAffiliateId: data.primaryAffiliateId ?? null,
        // isActive defaults to true (defined in schema)
      },
      include: {
        client: {
          select: { name: true },
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

  // STEP 5: Log Activity
  logger.info(
    {
      userId,
      affiliateId: affiliate.id,
      affiliateName: `${affiliate.firstName} ${affiliate.lastName}`,
      affiliateType: affiliate.affiliateType,
      clientId: affiliate.clientId,
    },
    'Affiliate created'
  )

  // STEP 6: Transform to Response DTO
  const response: CreateAffiliateResponse = {
    id: affiliate.id,
    firstName: affiliate.firstName,
    lastName: affiliate.lastName,
    email: affiliate.email,
    phone: affiliate.phone,
    dateOfBirth: affiliate.dateOfBirth
      ? affiliate.dateOfBirth.toISOString().split('T')[0]
      : null,
    documentType: affiliate.documentType,
    documentNumber: affiliate.documentNumber,
    affiliateType: affiliate.affiliateType,
    coverageType: affiliate.coverageType,
    clientId: affiliate.clientId,
    clientName: affiliate.client.name,
    primaryAffiliateId: affiliate.primaryAffiliateId,
    primaryAffiliateFirstName: affiliate.primaryAffiliate?.firstName ?? null,
    primaryAffiliateLastName: affiliate.primaryAffiliate?.lastName ?? null,
    hasUserAccount: affiliate.userId !== null,
    isActive: affiliate.isActive,
    createdAt: affiliate.createdAt.toISOString(),
    updatedAt: affiliate.updatedAt.toISOString(),
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
