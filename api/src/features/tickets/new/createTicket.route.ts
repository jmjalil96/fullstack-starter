/**
 * Route handler for creating tickets
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { createTicketSchema, type CreateTicketInput } from './createTicket.schema.js'
import { createTicket } from './createTicket.service.js'

const router = Router()

/**
 * POST /api/tickets
 * Create a new support ticket with initial message
 *
 * Authorization:
 * - ALL_AUTHORIZED_ROLES can create tickets
 * - BROKER_EMPLOYEES: Can create for any client, set reporterId, assign
 * - CLIENT_ADMIN: Can only create for accessible clients
 * - AFFILIATE: Can only create for their own client
 *
 * Request body:
 * - subject (required): Ticket subject/title (max 200 chars)
 * - message (required): Initial message content (max 5000 chars)
 * - priority (optional): LOW, NORMAL, HIGH, URGENT (default: NORMAL)
 * - category (optional): Ticket category (max 100 chars)
 * - clientId (required): Client ID
 * - reporterId (optional): Reporter user ID (broker only, for creating on behalf)
 * - relatedClaimId (optional): Related claim ID
 * - assignedToId (optional): Assigned employee ID (broker only)
 *
 * Returns:
 * - 201 Created: Ticket created successfully with initial message
 * - 400 Bad Request: Validation error or constraint violation
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Role not allowed or client access denied
 * - 404 Not Found: Related entity not found
 */
router.post(
  '/tickets',
  requireAuth,
  validateRequest({ body: createTicketSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const data = req.body as CreateTicketInput

    const ticket = await createTicket(userId, data)

    res.status(201).json(ticket)
  })
)

export default router
