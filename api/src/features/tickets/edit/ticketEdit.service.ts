/**
 * ticketEdit.service.ts
 * Service for updating tickets with role-based authorization
 *
 * Key policies:
 * - Only BROKER_EMPLOYEES can edit tickets
 * - closedAt auto-set when status changes to CLOSED
 * - closedAt cleared when reopening from CLOSED
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { TicketUpdateRequest, TicketUpdateResponse } from './ticketEdit.dto.js'

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
 * Update a ticket (broker employees only)
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - AFFILIATE and CLIENT_ADMIN cannot update tickets
 *
 * @param userId - ID of the requesting user
 * @param ticketId - ID of the ticket to update (CUID)
 * @param updates - Parsed updates from Zod
 * @returns Updated ticket as TicketUpdateResponse
 */
export async function updateTicket(
  userId: string,
  ticketId: string,
  updates: TicketUpdateRequest
): Promise<TicketUpdateResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (BROKER_EMPLOYEES only)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized ticket update attempt')
    throw new ForbiddenError('Solo empleados del broker pueden actualizar tickets')
  }

  // STEP 3: Load Ticket
  const current = await db.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      ticketNumber: true,
      status: true,
    },
  })

  if (!current) {
    logger.warn({ userId, ticketId }, 'Ticket not found for update')
    throw new NotFoundError('Ticket no encontrado')
  }

  // STEP 4: Clean Data for Prisma
  const dataEntries = Object.entries(updates).filter(([, v]) => v !== undefined)
  const data: Record<string, unknown> = Object.fromEntries(dataEntries)

  // STEP 5: Handle closedAt Logic
  if (updates.status === 'CLOSED' && current.status !== 'CLOSED') {
    // Closing ticket: set closedAt
    data.closedAt = new Date()
  } else if (updates.status && updates.status !== 'CLOSED' && current.status === 'CLOSED') {
    // Reopening ticket: clear closedAt
    data.closedAt = null
  }

  // STEP 6: Update Ticket
  const updated = await db.ticket.update({
    where: { id: ticketId },
    data,
    include: {
      client: {
        select: { name: true },
      },
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
      updates: Object.keys(updates),
      statusChange: updates.status ? { from: current.status, to: updates.status } : null,
    },
    'Ticket updated successfully'
  )

  // STEP 8: Return Response DTO
  const response: TicketUpdateResponse = {
    id: updated.id,
    ticketNumber: updated.ticketNumber,
    subject: updated.subject,
    status: updated.status,
    priority: updated.priority,
    category: updated.category,
    clientId: updated.clientId,
    clientName: updated.client.name,
    assignedToId: updated.assignedToId,
    assignedToName: updated.assignedTo?.name ?? null,
    closedAt: updated.closedAt?.toISOString() ?? null,
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
