/**
 * addMessage.service.ts
 * Service for adding messages to tickets with role-based authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { ALL_AUTHORIZED_ROLES } from '../../../shared/constants/roles.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { AddMessageRequest, AddMessageResponse } from './addMessage.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserContext {
  id: string
  name: string | null
  globalRole: { name: string } | null
  affiliate: { id: string; clientId: string } | null
  clientAccess: { clientId: string }[]
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Add a message to an existing ticket
 *
 * Authorization:
 * - AFFILIATE: Can only reply to tickets where they are creator or reporter
 * - CLIENT_ADMIN: Can reply to tickets from their accessible clients
 * - BROKER_EMPLOYEES: Can reply to any ticket
 * - All roles: Cannot reply to CLOSED tickets
 *
 * @param userId - ID of user adding the message
 * @param ticketId - ID of the ticket
 * @param data - Message data
 * @returns Created message with author info
 */
export async function addMessage(
  userId: string,
  ticketId: string,
  data: AddMessageRequest
): Promise<AddMessageResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !ALL_AUTHORIZED_ROLES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized ticket message attempt')
    throw new ForbiddenError('No tienes permiso para enviar mensajes')
  }

  // STEP 3: Load Ticket
  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      ticketNumber: true,
      status: true,
      clientId: true,
      reporterId: true,
      createdById: true,
    },
  })

  if (!ticket) {
    logger.warn({ userId, ticketId }, 'Ticket not found for message')
    throw new NotFoundError('Ticket no encontrado')
  }

  // STEP 4: Check Ticket Not Closed
  if (ticket.status === 'CLOSED') {
    logger.warn({ userId, ticketId, status: ticket.status }, 'Attempted to message closed ticket')
    throw new BadRequestError('No se pueden enviar mensajes a tickets cerrados')
  }

  // STEP 5: Role-Based Access Validation
  const isAffiliate = roleName === 'AFFILIATE'
  const isClientAdmin = roleName === 'CLIENT_ADMIN'

  if (isAffiliate) {
    // AFFILIATE can only reply to tickets where they are reporter or creator
    const isReporter = ticket.reporterId === userId
    const isCreator = ticket.createdById === userId

    if (!isReporter && !isCreator) {
      logger.warn(
        { userId, ticketId, ticketReporterId: ticket.reporterId, ticketCreatedById: ticket.createdById },
        'AFFILIATE attempted to message another user\'s ticket'
      )
      throw new NotFoundError('Ticket no encontrado')
    }
  } else if (isClientAdmin) {
    // CLIENT_ADMIN can only reply to tickets from their accessible clients
    const hasAccess = user.clientAccess.some((uc) => uc.clientId === ticket.clientId)
    if (!hasAccess) {
      logger.warn(
        { userId, ticketId, ticketClientId: ticket.clientId, accessibleClients: user.clientAccess.map((c) => c.clientId) },
        'CLIENT_ADMIN attempted to message unauthorized ticket'
      )
      throw new NotFoundError('Ticket no encontrado')
    }
  }
  // BROKER EMPLOYEES can reply to any ticket - no additional checks

  // STEP 6: Create Message
  const message = await db.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      message: data.message,
      authorId: userId,
    },
    include: {
      author: {
        select: { name: true },
      },
    },
  })

  // STEP 7: Log Activity
  logger.info(
    { userId, ticketId, messageId: message.id, ticketNumber: ticket.ticketNumber },
    'Ticket message added'
  )

  // STEP 8: Return Response
  const response: AddMessageResponse = {
    id: message.id,
    message: message.message,
    authorId: message.authorId,
    authorName: message.author.name ?? 'Unknown',
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    createdAt: message.createdAt.toISOString(),
  }

  return response
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with context for authorization
 */
async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
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
