/**
 * ticketDetail.service.ts
 * Service for fetching a single ticket detail with role-based authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { ALL_AUTHORIZED_ROLES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { TicketDetailResponse } from './ticketDetail.dto.js'

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
 * Get complete ticket detail by ID with role-based authorization
 *
 * Role-based access:
 * - BROKER EMPLOYEES: Can view any ticket
 * - CLIENT_ADMIN: Can view tickets where ticket.clientId is in their accessible clients
 * - AFFILIATE: Can view tickets where they are reporter or creator
 *
 * Security:
 * - Returns 404 if ticket does not exist OR user lacks access (avoid leaking existence)
 *
 * @param userId - ID of the requesting user
 * @param ticketId - ID of the ticket to fetch (CUID)
 * @returns TicketDetailResponse with full messages
 */
export async function getTicketById(
  userId: string,
  ticketId: string
): Promise<TicketDetailResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !ALL_AUTHORIZED_ROLES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized ticket detail access attempt')
    throw new ForbiddenError('No tienes permiso para ver tickets')
  }

  // STEP 3: Query Ticket with All Relations
  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      ticketSequence: true,
      ticketNumber: true,
      subject: true,
      status: true,
      priority: true,
      category: true,
      closedAt: true,
      createdAt: true,
      updatedAt: true,
      clientId: true,
      reporterId: true,
      createdById: true,
      assignedToId: true,
      relatedClaimId: true,
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
      relatedClaim: {
        select: { claimNumber: true },
      },
      messages: {
        select: {
          id: true,
          message: true,
          authorId: true,
          createdAt: true,
          author: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'asc' }, // Oldest first for conversation flow
      },
    },
  })

  // STEP 4: Validate Ticket Exists
  if (!ticket) {
    logger.warn({ userId, ticketId }, 'Ticket not found')
    throw new NotFoundError('Ticket no encontrado')
  }

  // STEP 5: Role-Based Access Validation
  const isAffiliate = roleName === 'AFFILIATE'
  const isClientAdmin = roleName === 'CLIENT_ADMIN'

  if (isAffiliate) {
    // AFFILIATE can only view tickets where they are reporter or creator
    const isReporter = ticket.reporterId === userId
    const isCreator = ticket.createdById === userId

    if (!isReporter && !isCreator) {
      logger.warn(
        { userId, ticketId, ticketReporterId: ticket.reporterId, ticketCreatedById: ticket.createdById },
        'AFFILIATE attempted to access another user\'s ticket'
      )
      throw new NotFoundError('Ticket no encontrado')
    }
  } else if (isClientAdmin) {
    // CLIENT_ADMIN can only view tickets from their accessible clients
    const hasAccess = user.clientAccess.some((uc) => uc.clientId === ticket.clientId)
    if (!hasAccess) {
      logger.warn(
        { userId, ticketId, ticketClientId: ticket.clientId, accessibleClients: user.clientAccess.map((c) => c.clientId) },
        'CLIENT_ADMIN attempted unauthorized ticket access'
      )
      throw new NotFoundError('Ticket no encontrado')
    }
  }
  // BROKER EMPLOYEES have access to any ticket - no additional checks needed

  // STEP 6: Transform to DTO Structure
  const response: TicketDetailResponse = {
    id: ticket.id,
    ticketSequence: ticket.ticketSequence,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    closedAt: ticket.closedAt?.toISOString() ?? null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),

    clientId: ticket.clientId,
    clientName: ticket.client.name,

    reporterId: ticket.reporterId,
    reporterName: ticket.reporter?.name ?? null,

    createdById: ticket.createdById,
    createdByName: ticket.createdBy.name ?? 'Unknown',

    assignedToId: ticket.assignedToId,
    assignedToName: ticket.assignedTo?.name ?? null,

    relatedClaimId: ticket.relatedClaimId,
    relatedClaimNumber: ticket.relatedClaim?.claimNumber ?? null,

    messages: ticket.messages.map((msg) => ({
      id: msg.id,
      message: msg.message,
      authorId: msg.authorId,
      authorName: msg.author.name ?? 'Unknown',
      createdAt: msg.createdAt.toISOString(),
    })),
  }

  // STEP 7: Log Successful Access
  logger.info({ userId, ticketId, role: roleName }, 'Ticket detail retrieved')

  // STEP 8: Return Response
  return response
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with role, affiliate, and client access context for authorization
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
