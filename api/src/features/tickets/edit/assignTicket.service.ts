/**
 * assignTicket.service.ts
 * Service for assigning tickets to employees
 *
 * Key policies:
 * - Only BROKER_EMPLOYEES can assign tickets
 * - Assignee must be a broker employee
 * - Cannot assign closed tickets
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

import type { AssignTicketRequest, AssignTicketResponse } from './assignTicket.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Assign a ticket to an employee (broker employees only)
 *
 * @param userId - ID of the requesting user
 * @param ticketId - ID of the ticket to assign
 * @param data - Assignment data
 * @returns Updated ticket assignment info
 */
export async function assignTicket(
  userId: string,
  ticketId: string,
  data: AssignTicketRequest
): Promise<AssignTicketResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (BROKER_EMPLOYEES only)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized ticket assignment attempt')
    throw new ForbiddenError('Solo empleados del broker pueden asignar tickets')
  }

  // STEP 3: Load Ticket
  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      ticketNumber: true,
      status: true,
      assignedToId: true,
    },
  })

  if (!ticket) {
    logger.warn({ userId, ticketId }, 'Ticket not found for assignment')
    throw new NotFoundError('Ticket no encontrado')
  }

  // STEP 4: Check Ticket Not Closed
  if (ticket.status === 'CLOSED') {
    logger.warn({ userId, ticketId, status: ticket.status }, 'Attempted to assign closed ticket')
    throw new BadRequestError('No se pueden asignar tickets cerrados')
  }

  // STEP 5: Validate Assignee (if not null)
  if (data.assignedToId !== null) {
    const assignee = await db.user.findUnique({
      where: { id: data.assignedToId },
      select: {
        id: true,
        name: true,
        globalRole: { select: { name: true } },
      },
    })

    if (!assignee) {
      logger.warn({ userId, assigneeId: data.assignedToId }, 'Assignee not found')
      throw new NotFoundError('Usuario a asignar no encontrado')
    }

    const assigneeRole = assignee.globalRole?.name
    if (!assigneeRole || !BROKER_EMPLOYEES.includes(assigneeRole as never)) {
      logger.warn({ userId, assigneeId: data.assignedToId, assigneeRole }, 'Assignee is not a broker employee')
      throw new BadRequestError('Solo se puede asignar a empleados del broker')
    }
  }

  // STEP 6: Update Ticket
  const updated = await db.ticket.update({
    where: { id: ticketId },
    data: {
      assignedToId: data.assignedToId,
    },
    include: {
      assignedTo: {
        select: { name: true },
      },
    },
  })

  // STEP 7: Log Activity
  logger.info(
    {
      userId,
      ticketId,
      ticketNumber: updated.ticketNumber,
      role: roleName,
      previousAssignee: ticket.assignedToId,
      newAssignee: data.assignedToId,
    },
    'Ticket assigned successfully'
  )

  // STEP 8: Return Response DTO
  const response: AssignTicketResponse = {
    id: updated.id,
    ticketNumber: updated.ticketNumber,
    assignedToId: updated.assignedToId,
    assignedToName: updated.assignedTo?.name ?? null,
    updatedAt: updated.updatedAt.toISOString(),
  }

  return response
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with role context for authorization
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
