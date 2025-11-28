/**
 * viewClaims.service.ts
 * Service for viewing and listing claims with role-based authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import { ALL_AUTHORIZED_ROLES, BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import { ForbiddenError, UnauthorizedError } from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type {
  ClaimListItemResponse,
  GetClaimsQueryParams,
  GetClaimsResponse,
  PaginationMetadata,
} from './viewClaims.dto.js'

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
 * Get claims based on user role and query filters
 *
 * Role-based scoping:
 * - AFFILIATE: Only claims where they are the main affiliate
 * - CLIENT_ADMIN: Claims from all their accessible clients
 * - BROKER EMPLOYEES: All claims (can filter by client, status, search)
 *
 * @param userId - ID of user requesting claims
 * @param query - Validated query parameters (status, clientId, search, page, limit)
 * @returns Paginated claims list with metadata
 */
export async function getClaims(
  userId: string,
  query: GetClaimsQueryParams
): Promise<GetClaimsResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !ALL_AUTHORIZED_ROLES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized claims list access attempt')
    throw new ForbiddenError('No tienes permiso para ver reclamos')
  }

  // STEP 3: Build Base Where Clause (Role-Based Scoping)
  const isAffiliate = roleName === 'AFFILIATE'
  const isClientAdmin = roleName === 'CLIENT_ADMIN'
  const isBrokerEmployee = BROKER_EMPLOYEES.includes(roleName as never)

  let where: Prisma.ClaimWhereInput = {}

  if (isAffiliate) {
    // AFFILIATE: Only claims where they are the main affiliate
    if (!user.affiliate) {
      logger.warn({ userId }, 'AFFILIATE has no affiliate record')
      return emptyResponse(query)
    }

    where = {
      affiliateId: user.affiliate.id,
      clientId: user.affiliate.clientId, // Security: constrain to their client
    }
  } else if (isClientAdmin) {
    // CLIENT_ADMIN: Claims from all accessible clients
    const accessibleClientIds = user.clientAccess.map((uc) => uc.clientId)

    if (accessibleClientIds.length === 0) {
      logger.info({ userId }, 'CLIENT_ADMIN has no client access')
      return emptyResponse(query)
    }

    where = {
      clientId: { in: accessibleClientIds },
    }
  }
  // BROKER EMPLOYEES: No base restrictions (where stays empty)

  // STEP 4: Apply Query Filters
  if (query.status) {
    where.status = query.status
  }

  if (query.search) {
    // Multi-field partial match search (case-insensitive)
    const searchTerm = query.search
    where.OR = [
      { claimNumber: { contains: searchTerm, mode: 'insensitive' } },
      { affiliate: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
      { affiliate: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
      { patient: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
      { patient: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
    ]
  }

  // Date range filtering
  if (query.dateField && (query.dateFrom || query.dateTo)) {
    const dateFilter: Prisma.DateTimeFilter = {}

    if (query.dateFrom) {
      dateFilter.gte = new Date(query.dateFrom)
    }

    if (query.dateTo) {
      // End of day for inclusive range
      dateFilter.lte = new Date(`${query.dateTo}T23:59:59.999Z`)
    }

    // Apply filter to the selected date field
    where[query.dateField] = dateFilter
  }

  if (query.clientId) {
    // Apply client filter based on role
    if (isAffiliate) {
      // AFFILIATE: Ignore clientId filter (can only see their own client)
      logger.info({ userId, requestedClient: query.clientId }, 'AFFILIATE clientId filter ignored')
    } else if (isClientAdmin) {
      // CLIENT_ADMIN: Validate access to requested client
      const hasAccess = user.clientAccess.some((uc) => uc.clientId === query.clientId)
      if (!hasAccess) {
        logger.warn(
          {
            userId,
            requestedClient: query.clientId,
            accessibleClients: user.clientAccess.map((c) => c.clientId),
          },
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

  // STEP 5: Calculate Pagination
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const skip = (page - 1) * limit
  const take = limit

  // STEP 6: Execute Parallel Queries
  const [claims, total] = await Promise.all([
    db.claim.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }, // Newest first
      select: {
        id: true,
        claimNumber: true,
        status: true,
        clientId: true,
        affiliateId: true,
        patientId: true,
        careType: true,
        amountSubmitted: true,
        amountApproved: true,
        submittedDate: true,
        settlementDate: true,
        createdAt: true,
        client: {
          select: { name: true },
        },
        affiliate: {
          select: { firstName: true, lastName: true },
        },
        patient: {
          select: { firstName: true, lastName: true },
        },
      },
    }),
    db.claim.count({ where }),
  ])

  // STEP 7: Transform Data to DTO
  const transformedClaims: ClaimListItemResponse[] = claims.map((claim) => ({
    id: claim.id,
    claimNumber: claim.claimNumber,
    status: claim.status as ClaimListItemResponse['status'],
    clientId: claim.clientId,
    clientName: claim.client.name,
    affiliateId: claim.affiliateId,
    affiliateFirstName: claim.affiliate.firstName,
    affiliateLastName: claim.affiliate.lastName,
    patientId: claim.patientId,
    patientFirstName: claim.patient.firstName,
    patientLastName: claim.patient.lastName,
    careType: claim.careType as ClaimListItemResponse['careType'],
    amountSubmitted: claim.amountSubmitted,
    amountApproved: claim.amountApproved,
    submittedDate: claim.submittedDate?.toISOString().split('T')[0] ?? null,
    settlementDate: claim.settlementDate?.toISOString().split('T')[0] ?? null,
    createdAt: claim.createdAt.toISOString(),
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
      filters: {
        status: query.status,
        clientId: query.clientId,
        search: query.search,
        dateField: query.dateField,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      },
      resultCount: transformedClaims.length,
      total,
      page,
    },
    'Claims retrieved'
  )

  // STEP 10: Return Response
  return {
    claims: transformedClaims,
    pagination,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with all context needed for claims authorization
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
 * Return empty response with pagination for edge cases
 */
function emptyResponse(query: GetClaimsQueryParams): GetClaimsResponse {
  const page = query.page ?? 1
  const limit = query.limit ?? 20

  return {
    claims: [],
    pagination: {
      total: 0,
      page,
      limit,
      totalPages: 0,
      hasMore: false,
    },
  }
}
