/**
 * viewTickets.service.ts
 * Service for viewing and listing tickets with role-based authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import { ALL_AUTHORIZED_ROLES, BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type {
  GetTicketsQueryParams,
  GetTicketsResponse,
  PaginationMetadata,
  TicketListItemResponse,
} from './viewTickets.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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
 * Get tickets based on user role and query filters
 *
 * Role-based scoping:
 * - AFFILIATE: Only tickets where they are reporter or creator
 * - CLIENT_ADMIN: Tickets from all their accessible clients
 * - BROKER EMPLOYEES: All tickets (can filter by client, status, assignee, etc.)
 *
 * @param userId - ID of user requesting tickets
 * @param query - Validated query parameters
 * @returns Paginated tickets list with metadata
 */
export async function getTickets(
  userId: string,
  query: GetTicketsQueryParams
): Promise<GetTicketsResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !ALL_AUTHORIZED_ROLES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized tickets list access attempt')
    throw new ForbiddenError('No tienes permiso para ver tickets')
  }

  // STEP 3: Build Base Where Clause (Role-Based Scoping)
  const isAffiliate = roleName === 'AFFILIATE'
  const isClientAdmin = roleName === 'CLIENT_ADMIN'
  const isBrokerEmployee = BROKER_EMPLOYEES.includes(roleName as never)

  let where: Prisma.TicketWhereInput = {}

  if (isAffiliate) {
    // AFFILIATE: Only tickets where they are reporter OR creator
    if (!user.affiliate) {
      logger.warn({ userId }, 'AFFILIATE has no affiliate record')
      return emptyResponse(query)
    }

    where = {
      clientId: user.affiliate.clientId, // Security: constrain to their client
      OR: [
        { reporterId: userId },
        { createdById: userId },
      ],
    }
  } else if (isClientAdmin) {
    // CLIENT_ADMIN: Tickets from all accessible clients
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

  if (query.priority) {
    where.priority = query.priority
  }

  if (query.category) {
    where.category = query.category
  }

  if (query.search) {
    // Search by ticket number (already uppercased by schema)
    where.ticketNumber = query.search
  }

  // STEP 5: Apply clientId filter with role validation
  if (query.clientId) {
    if (isAffiliate) {
      // AFFILIATE: Ignore clientId filter (can only see their own client)
      logger.info({ userId, requestedClient: query.clientId }, 'AFFILIATE clientId filter ignored')
    } else if (isClientAdmin) {
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

  // STEP 6: Apply assignedToId filter (broker only)
  if (query.assignedToId) {
    if (!isBrokerEmployee) {
      logger.info({ userId, role: roleName }, 'Non-broker assignedToId filter ignored')
    } else {
      where.assignedToId = query.assignedToId
    }
  }

  // STEP 7: Calculate Pagination
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const skip = (page - 1) * limit
  const take = limit

  // STEP 8: Execute Parallel Queries
  const [tickets, total] = await Promise.all([
    db.ticket.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }, // Newest first
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        priority: true,
        category: true,
        clientId: true,
        reporterId: true,
        createdById: true,
        assignedToId: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: { name: true },
        },
        reporter: {
          select: { name: true },
        },
        createdBy: {
          select: { name: true },
        },
        assignedTo: {
          select: { name: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    }),
    db.ticket.count({ where }),
  ])

  // STEP 9: Transform Data to DTO
  const transformedTickets: TicketListItemResponse[] = tickets.map((ticket) => ({
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    clientId: ticket.clientId,
    clientName: ticket.client.name,
    reporterId: ticket.reporterId,
    reporterName: ticket.reporter?.name ?? null,
    createdById: ticket.createdById,
    createdByName: ticket.createdBy.name ?? 'Unknown',
    assignedToId: ticket.assignedToId,
    assignedToName: ticket.assignedTo?.name ?? null,
    messageCount: ticket._count.messages,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  }))

  // STEP 10: Calculate Pagination Metadata
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  const pagination: PaginationMetadata = {
    total,
    page,
    limit,
    totalPages,
    hasMore,
  }

  // STEP 11: Log Activity
  logger.info(
    {
      userId,
      role: roleName,
      filters: {
        status: query.status,
        priority: query.priority,
        clientId: query.clientId,
        assignedToId: query.assignedToId,
        category: query.category,
        search: query.search,
      },
      resultCount: transformedTickets.length,
      total,
      page,
    },
    'Tickets retrieved'
  )

  // STEP 12: Return Response
  return {
    tickets: transformedTickets,
    pagination,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with all context needed for ticket authorization
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
function emptyResponse(query: GetTicketsQueryParams): GetTicketsResponse {
  const page = query.page ?? 1
  const limit = query.limit ?? 20

  return {
    tickets: [],
    pagination: {
      total: 0,
      page,
      limit,
      totalPages: 0,
      hasMore: false,
    },
  }
}
