/**
 * Route handler for adding messages to tickets
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { addMessageSchema, ticketIdParamSchema, type AddMessageInput, type TicketIdParam } from './addMessage.schema.js'
import { addMessage } from './addMessage.service.js'

const router = Router()

/**
 * POST /api/tickets/:id/messages
 * Add a message to an existing ticket
 *
 * Authorization:
 * - AFFILIATE: Can only reply to tickets where they are creator or reporter
 * - CLIENT_ADMIN: Can reply to tickets from accessible clients
 * - BROKER_EMPLOYEES: Can reply to any ticket
 * - All roles: Cannot reply to CLOSED tickets
 *
 * Request body:
 * - message (required): Message content (max 5000 chars)
 *
 * Returns:
 * - 201 Created: Message created successfully
 * - 400 Bad Request: Ticket is closed or validation error
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Role not allowed
 * - 404 Not Found: Ticket not found or access denied
 */
router.post(
  '/tickets/:id/messages',
  requireAuth,
  validateRequest({ params: ticketIdParamSchema, body: addMessageSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id: ticketId } = req.params as TicketIdParam
    const data = req.body as AddMessageInput

    const message = await addMessage(userId, ticketId, data)

    res.status(201).json(message)
  })
)

export default router
