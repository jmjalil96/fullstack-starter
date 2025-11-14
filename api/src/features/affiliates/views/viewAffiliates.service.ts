/**
 * viewAffiliates.service.ts
 * Service for viewing and listing affiliates with role-based authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type {
  AffiliateListItemResponse,
  GetAffiliatesQueryParams,
  GetAffiliatesResponse,
  PaginationMetadata,
} from './viewAffiliates.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// User context type (returned from getUserWithContext)
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
 * Get affiliates based on user role and query filters
 *
 * Role-based scoping:
 * - BROKER_EMPLOYEES: Can view all affiliates
 * - CLIENT_ADMIN: Can view affiliates from accessible clients only
 * - AFFILIATE: Cannot access (403 Forbidden)
 *
 * @param userId - ID of user requesting affiliates
 * @param query - Validated query parameters (clientId, search, affiliateType, coverageType, isActive, page, limit)
 * @returns Paginated affiliates list with metadata
 */
export async function getAffiliates(
  userId: string,
  query: GetAffiliatesQueryParams
): Promise<GetAffiliatesResponse> {
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
    logger.warn({ userId, role: roleName }, 'Unauthorized affiliates list access attempt')
    throw new ForbiddenError('No tienes permiso para ver afiliados')
  }

  // STEP 3: Build Base WHERE Clause (Role-Based Scoping)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let where: any = {}

  if (isClientAdmin) {
    // CLIENT_ADMIN: Only affiliates from accessible clients
    const accessibleClientIds = user.clientAccess.map((uc) => uc.clientId)

    if (accessibleClientIds.length === 0) {
      logger.info({ userId }, 'CLIENT_ADMIN has no client access')
      return emptyResponse(query)
    }

    where = {
      clientId: { in: accessibleClientIds },
    }
  }
  // BROKER_EMPLOYEES: No base scoping (where stays empty)

  // STEP 4: Apply Query Filters
  if (query.clientId) {
    // Apply client filter with role-based validation
    if (isClientAdmin) {
      // CLIENT_ADMIN: Validate access to requested client
      const hasAccess = user.clientAccess.some((uc) => uc.clientId === query.clientId)
      if (!hasAccess) {
        logger.warn(
          { userId, requestedClient: query.clientId, accessibleClients: user.clientAccess.map((c) => c.clientId) },
          'CLIENT_ADMIN attempted unauthorized client filter'
        )
        throw new ForbiddenError('No tienes acceso a este cliente')
      }
      where.clientId = query.clientId
    } else if (isBrokerEmployee) {
      // BROKER: Apply filter directly
      where.clientId = query.clientId
    }
  }

  if (query.search) {
    // Search across firstName, lastName, documentNumber, client.name (case-insensitive, partial match)
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { documentNumber: { contains: query.search, mode: 'insensitive' } },
      { client: { name: { contains: query.search, mode: 'insensitive' } } },
    ]
  }

  if (query.affiliateType) {
    where.affiliateType = query.affiliateType
  }

  if (query.coverageType) {
    where.coverageType = query.coverageType
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive
  }

  // STEP 5: Calculate Pagination
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const skip = (page - 1) * limit
  const take = limit

  // STEP 6: Execute Parallel Queries
  const [affiliates, total] = await Promise.all([
    db.affiliate.findMany({
      where,
      skip,
      take,
      orderBy: [
        { client: { name: 'asc' } },      // Group by client alphabetically
        { lastName: 'asc' },              // Then by family (last name)
        { affiliateType: 'asc' },         // OWNER before DEPENDENT (enum order)
        { firstName: 'asc' },             // Then by first name
      ],
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
        clientId: true,
        primaryAffiliateId: true,
        userId: true,
        isActive: true,
        createdAt: true,
        client: {
          select: { name: true },
        },
        primaryAffiliate: {
          select: { firstName: true, lastName: true },
        },
      },
    }),
    db.affiliate.count({ where }),
  ])

  // STEP 7: Transform Data to DTO
  const transformedAffiliates: AffiliateListItemResponse[] = affiliates.map((affiliate) => ({
    id: affiliate.id,
    firstName: affiliate.firstName,
    lastName: affiliate.lastName,
    email: affiliate.email,
    phone: affiliate.phone,
    dateOfBirth: affiliate.dateOfBirth?.toISOString().split('T')[0] ?? null,
    documentType: affiliate.documentType,
    documentNumber: affiliate.documentNumber,
    affiliateType: affiliate.affiliateType as AffiliateListItemResponse['affiliateType'],
    coverageType: affiliate.coverageType as AffiliateListItemResponse['coverageType'],
    clientId: affiliate.clientId,
    clientName: affiliate.client.name,
    primaryAffiliateId: affiliate.primaryAffiliateId,
    primaryAffiliateFirstName: affiliate.primaryAffiliate?.firstName ?? null,
    primaryAffiliateLastName: affiliate.primaryAffiliate?.lastName ?? null,
    hasUserAccount: affiliate.userId !== null,
    isActive: affiliate.isActive,
    createdAt: affiliate.createdAt.toISOString(),
  }))

  // STEP 8: Calculate Pagination Metadata
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  const pagination: PaginationMetadata = {
    total,
    page,
    limit,
    totalPages,
    hasMore,
  }

  // STEP 9: Log Activity
  logger.info(
    {
      userId,
      role: roleName,
      isBrokerEmployee,
      isClientAdmin,
      accessibleClients: isClientAdmin ? user.clientAccess.map((c) => c.clientId) : undefined,
      filters: { clientId: query.clientId, search: query.search, affiliateType: query.affiliateType, coverageType: query.coverageType, isActive: query.isActive },
      resultCount: transformedAffiliates.length,
      total,
      page,
    },
    'Affiliates retrieved'
  )

  // STEP 10: Return Response
  return {
    affiliates: transformedAffiliates,
    pagination,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with all context needed for authorization
 *
 * @param userId - User ID to load
 * @returns User with role, affiliate, and client access data
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

/**
 * Return empty response when user has no access
 *
 * @param query - Query parameters (for pagination)
 * @returns Empty response with proper pagination structure
 */
function emptyResponse(query: GetAffiliatesQueryParams): GetAffiliatesResponse {
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
