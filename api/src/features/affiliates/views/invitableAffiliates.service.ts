/**
 * invitableAffiliates.service.ts
 * Service for fetching affiliates that can be invited
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type {
  GetInvitableAffiliatesQueryParams,
  GetInvitableAffiliatesResponse,
  InvitableAffiliateResponse,
  PaginationMetadata,
} from './invitableAffiliates.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** User context type (returned from getUserWithContext) */
interface UserContext {
  id: string
  globalRole: { name: string } | null
  clientAccess: { clientId: string }[]
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Get affiliates that can be invited (have email, no userId, isActive)
 *
 * Role-based scoping:
 * - BROKER_EMPLOYEES: Can view all invitable affiliates
 * - CLIENT_ADMIN: Can view invitable affiliates from accessible clients only
 * - AFFILIATE: Cannot access (403 Forbidden)
 *
 * Filter criteria for invitable affiliates:
 * - email IS NOT NULL (required for invitation)
 * - userId IS NULL (not already linked to a user account)
 * - isActive = true (active affiliates only)
 * - No PENDING invitation exists for this affiliate
 *
 * @param userId - ID of user requesting affiliates
 * @param query - Validated query parameters
 * @returns Paginated invitable affiliates list
 */
export async function getInvitableAffiliates(
  userId: string,
  query: GetInvitableAffiliatesQueryParams
): Promise<GetInvitableAffiliatesResponse> {
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
    logger.warn({ userId, role: roleName }, 'Unauthorized invitable affiliates access attempt')
    throw new ForbiddenError('No tienes permiso para ver afiliados invitables')
  }

  // STEP 3: Build Base WHERE Clause
  const where: Prisma.AffiliateWhereInput = {
    // Must have email
    email: { not: null },
    // Must not be linked to a user
    userId: null,
    // Must be active
    isActive: true,
    // Must not have a pending invitation
    invitation: null,
  }

  // STEP 4: Apply Role-Based Scoping
  if (isClientAdmin) {
    const accessibleClientIds = user.clientAccess.map((uc) => uc.clientId)

    if (accessibleClientIds.length === 0) {
      logger.info({ userId }, 'CLIENT_ADMIN has no client access')
      return emptyResponse(query)
    }

    where.clientId = { in: accessibleClientIds }
  }

  // STEP 5: Apply Query Filters
  if (query.clientId) {
    if (isClientAdmin) {
      // Validate client access
      const hasAccess = user.clientAccess.some((uc) => uc.clientId === query.clientId)
      if (!hasAccess) {
        logger.warn(
          { userId, requestedClient: query.clientId },
          'CLIENT_ADMIN attempted unauthorized client filter'
        )
        throw new ForbiddenError('No tienes acceso a este cliente')
      }
    }
    where.clientId = query.clientId
  }

  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { documentNumber: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  // STEP 6: Calculate Pagination
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const skip = (page - 1) * limit
  const take = limit

  // STEP 7: Execute Parallel Queries
  const [affiliates, total] = await Promise.all([
    db.affiliate.findMany({
      where,
      skip,
      take,
      orderBy: [
        { client: { name: 'asc' } },
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        documentNumber: true,
        clientId: true,
        client: {
          select: { name: true },
        },
      },
    }),
    db.affiliate.count({ where }),
  ])

  // STEP 8: Transform Data to DTO
  // Note: email is guaranteed non-null from where clause, using fallback for TypeScript safety
  const transformedAffiliates: InvitableAffiliateResponse[] = affiliates.map((affiliate) => ({
    id: affiliate.id,
    firstName: affiliate.firstName,
    lastName: affiliate.lastName,
    email: affiliate.email ?? '',
    documentNumber: affiliate.documentNumber,
    clientId: affiliate.clientId,
    clientName: affiliate.client.name,
  }))

  // STEP 9: Calculate Pagination Metadata
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  const pagination: PaginationMetadata = {
    total,
    page,
    limit,
    totalPages,
    hasMore,
  }

  // STEP 10: Log Activity
  logger.info(
    {
      userId,
      role: roleName,
      filters: { clientId: query.clientId, search: query.search },
      resultCount: transformedAffiliates.length,
      total,
    },
    'Invitable affiliates retrieved'
  )

  // STEP 11: Return Response
  return {
    affiliates: transformedAffiliates,
    pagination,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with context for authorization
 *
 * @param userId - User ID to load
 * @returns User with role and client access data
 */
async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
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

/**
 * Return empty response when user has no access
 *
 * @param query - Query parameters (for pagination)
 * @returns Empty response with proper pagination structure
 */
function emptyResponse(query: GetInvitableAffiliatesQueryParams): GetInvitableAffiliatesResponse {
  const page = query.page ?? 1
  const limit = query.limit ?? 20

  return {
    affiliates: [],
    pagination: {
      total: 0,
      page,
      limit,
      totalPages: 0,
      hasMore: false,
    },
  }
}
