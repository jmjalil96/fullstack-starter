/**
 * Route handler for updating tickets
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { ticketIdParamSchema, ticketUpdateSchema, type TicketIdParam, type TicketUpdateInput } from './ticketEdit.schema.js'
import { updateTicket } from './ticketEdit.service.js'

const router = Router()

/**
 * PATCH /api/tickets/:id
 * Update a ticket (broker employees only)
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can update any ticket
 * - AFFILIATE, CLIENT_ADMIN: Cannot update tickets
 *
 * Request body:
 * - status (optional): OPEN, IN_PROGRESS, WAITING_ON_CLIENT, RESOLVED, CLOSED
 * - priority (optional): LOW, NORMAL, HIGH, URGENT
 * - category (optional): string or null
 *
 * Returns:
 * - 200 OK: Ticket updated successfully
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Role not allowed
 * - 404 Not Found: Ticket not found
 */
router.patch(
  '/tickets/:id',
  requireAuth,
  validateRequest({ params: ticketIdParamSchema, body: ticketUpdateSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id: ticketId } = req.params as TicketIdParam
    const data = req.body as TicketUpdateInput

    const ticket = await updateTicket(userId, ticketId, data)

    res.json(ticket)
  })
)

export default router
