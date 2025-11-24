/**
 * viewPolicies.service.ts
 * Service for viewing and listing policies with role-based authorization
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
  GetPoliciesQueryParams,
  GetPoliciesResponse,
  PaginationMetadata,
  PolicyListItemResponse,
} from './viewPolicies.dto.js'

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
 * Get policies based on filters
 *
 * Role-based authorization:
 * - BROKER_EMPLOYEES: Can view all policies (no scoping)
 * - CLIENT_ADMIN: Can view policies from accessible clients only
 * - AFFILIATE: Cannot access (403 Forbidden)
 *
 * @param userId - ID of user requesting policies
 * @param query - Validated query parameters (status, clientId, insurerId, search, page, limit)
 * @returns Paginated policies list with metadata
 */
export async function getPolicies(
  userId: string,
  query: GetPoliciesQueryParams
): Promise<GetPoliciesResponse> {
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
    logger.warn({ userId, role: roleName }, 'Unauthorized policies list access attempt')
    throw new ForbiddenError('No tienes permiso para ver pólizas')
  }

  // STEP 3: Build Base WHERE Clause with Role-Based Scoping
  let where: Prisma.PolicyWhereInput = {}

  if (isClientAdmin) {
    // CLIENT_ADMIN: Only policies from accessible clients
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
  if (query.status) {
    where.status = query.status
  }

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

  if (query.insurerId) {
    where.insurerId = query.insurerId
  }

  if (query.search) {
    // Search by policy number (already uppercased by schema)
    where.policyNumber = query.search
  }

  // STEP 5: Calculate Pagination
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const skip = (page - 1) * limit
  const take = limit

  // STEP 6: Execute Parallel Queries
  const [policies, total] = await Promise.all([
    db.policy.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }, // Newest first
      select: {
        id: true,
        policyNumber: true,
        status: true,
        type: true,
        clientId: true,
        insurerId: true,
        startDate: true,
        endDate: true,
        isActive: true,
        createdAt: true,
        client: {
          select: { name: true },
        },
        insurer: {
          select: { name: true },
        },
      },
    }),
    db.policy.count({ where }),
  ])

  // STEP 7: Transform Data to DTO
  const transformedPolicies: PolicyListItemResponse[] = policies.map((policy) => ({
    id: policy.id,
    policyNumber: policy.policyNumber,
    status: policy.status as PolicyListItemResponse['status'],
    type: policy.type,
    clientId: policy.clientId,
    clientName: policy.client.name,
    insurerId: policy.insurerId,
    insurerName: policy.insurer.name,
    startDate: policy.startDate.toISOString().split('T')[0],
    endDate: policy.endDate.toISOString().split('T')[0],
    isActive: policy.isActive,
    createdAt: policy.createdAt.toISOString(),
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
      filters: { status: query.status, clientId: query.clientId, insurerId: query.insurerId, search: query.search },
      resultCount: transformedPolicies.length,
      total,
      page,
    },
    'Policies retrieved'
  )

  // STEP 10: Return Response
  return {
    policies: transformedPolicies,
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
function emptyResponse(query: GetPoliciesQueryParams): GetPoliciesResponse {
  const page = query.page ?? 1
  const limit = query.limit ?? 20

  return {
    policies: [],
    pagination: {
      total: 0,
      page,
      limit,
      totalPages: 0,
      hasMore: false,
    },
  }
}
