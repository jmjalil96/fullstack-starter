/**
 * Route handler for assigning tickets
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { assignTicketSchema, ticketIdParamSchema, type AssignTicketInput, type TicketIdParam } from './assignTicket.schema.js'
import { assignTicket } from './assignTicket.service.js'

const router = Router()

/**
 * PATCH /api/tickets/:id/assign
 * Assign a ticket to an employee (broker employees only)
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can assign any ticket
 * - AFFILIATE, CLIENT_ADMIN: Cannot assign tickets
 *
 * Request body:
 * - assignedToId: CUID of employee to assign (or null to unassign)
 *
 * Returns:
 * - 200 OK: Ticket assigned successfully
 * - 400 Bad Request: Ticket closed or assignee not broker employee
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Role not allowed
 * - 404 Not Found: Ticket or assignee not found
 */
router.patch(
  '/tickets/:id/assign',
  requireAuth,
  validateRequest({ params: ticketIdParamSchema, body: assignTicketSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id: ticketId } = req.params as TicketIdParam
    const data = req.body as AssignTicketInput

    const ticket = await assignTicket(userId, ticketId, data)

    res.json(ticket)
  })
)

export default router
