/**
 * viewClients.service.ts
 * Service for viewing and listing clients with role-based authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { ALL_AUTHORIZED_ROLES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type {
  ClientListItemResponse,
  GetClientsQueryParams,
  GetClientsResponse,
  PaginationMetadata,
} from './viewClients.dto.js'

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
 * Get clients based on user role and query filters
 *
 * Role-based scoping:
 * - AFFILIATE: Only their own client
 * - CLIENT_ADMIN: All their accessible clients
 * - BROKER EMPLOYEES: All clients (can filter by search, isActive)
 *
 * @param userId - ID of user requesting clients
 * @param query - Validated query parameters (search, isActive, page, limit)
 * @returns Paginated clients list with metadata
 */
export async function getClients(
  userId: string,
  query: GetClientsQueryParams
): Promise<GetClientsResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !ALL_AUTHORIZED_ROLES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized clients list access attempt')
    throw new ForbiddenError('No tienes permiso para ver clientes')
  }

  // STEP 3: Build Base Where Clause (Role-Based Scoping)
  const isAffiliate = roleName === 'AFFILIATE'
  const isClientAdmin = roleName === 'CLIENT_ADMIN'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let where: any = {}

  if (isAffiliate) {
    // AFFILIATE: Only their own client
    if (!user.affiliate) {
      logger.warn({ userId }, 'AFFILIATE has no affiliate record')
      return emptyResponse(query)
    }

    where = {
      id: user.affiliate.clientId,
    }
  } else if (isClientAdmin) {
    // CLIENT_ADMIN: All accessible clients
    const accessibleClientIds = user.clientAccess.map((uc) => uc.clientId)

    if (accessibleClientIds.length === 0) {
      logger.info({ userId }, 'CLIENT_ADMIN has no client access')
      return emptyResponse(query)
    }

    where = {
      id: { in: accessibleClientIds },
    }
  }
  // BROKER EMPLOYEES: No base restrictions (where stays empty)

  // STEP 4: Apply Query Filters
  if (query.isActive !== undefined) {
    where.isActive = query.isActive
  }

  if (query.search) {
    // Search across name, taxId, email (case-insensitive, partial match)
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { taxId: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  // STEP 5: Calculate Pagination
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const skip = (page - 1) * limit
  const take = limit

  // STEP 6: Execute Parallel Queries
  const [clients, total] = await Promise.all([
    db.client.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }, // Newest first
      select: {
        id: true,
        name: true,
        taxId: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
      },
    }),
    db.client.count({ where }),
  ])

  // STEP 7: Transform Data to DTO
  const transformedClients: ClientListItemResponse[] = clients.map((client) => ({
    id: client.id,
    name: client.name,
    taxId: client.taxId,
    email: client.email,
    phone: client.phone,
    address: client.address,
    isActive: client.isActive,
    createdAt: client.createdAt.toISOString(),
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
      filters: { search: query.search, isActive: query.isActive },
      resultCount: transformedClients.length,
      total,
      page,
    },
    'Clients retrieved'
  )

  // STEP 10: Return Response
  return {
    clients: transformedClients,
    pagination,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with all context needed for clients authorization
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
function emptyResponse(query: GetClientsQueryParams): GetClientsResponse {
  const page = query.page ?? 1
  const limit = query.limit ?? 20

  return {
    clients: [],
    pagination: {
      total: 0,
      page,
      limit,
      totalPages: 0,
      hasMore: false,
    },
  }
}
