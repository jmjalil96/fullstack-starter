/**
 * viewTickets.route.ts
 * Route for viewing and listing tickets
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { ticketIdParamSchema, type TicketIdParam } from './ticketDetail.schema.js'
import { getTicketById } from './ticketDetail.service.js'
import { getTicketsQuerySchema, type GetTicketsQuery } from './viewTickets.schema.js'
import { getTickets } from './viewTickets.service.js'

const router = Router()

/**
 * GET /api/tickets
 * Get paginated list of tickets based on user role and filters
 *
 * Query params:
 * - status (optional): Filter by ticket status (OPEN, IN_PROGRESS, WAITING_ON_CLIENT, RESOLVED, CLOSED)
 * - priority (optional): Filter by priority (LOW, NORMAL, HIGH, URGENT)
 * - clientId (optional): Filter by client
 * - assignedToId (optional): Filter by assigned employee (broker only)
 * - category (optional): Filter by category
 * - search (optional): Search by ticket number
 * - page (default: 1): Page number
 * - limit (default: 20, max: 100): Items per page
 *
 * Returns tickets based on role:
 * - AFFILIATE: Only their tickets (reporter or creator)
 * - CLIENT_ADMIN: Tickets from accessible clients
 * - BROKER EMPLOYEES: All tickets (can filter)
 */
router.get(
  '/tickets',
  requireAuth,
  validateRequest({ query: getTicketsQuerySchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    // Zod validation ensures query params are validated and have defaults
    const query = req.query as unknown as GetTicketsQuery

    const response = await getTickets(userId, query)

    res.status(200).json(response)
  })
)

/**
 * GET /api/tickets/:id
 * Get complete ticket detail by ID with role-based authorization
 *
 * Returns detailed ticket information with messages based on role:
 * - AFFILIATE: Only their tickets (reporter or creator)
 * - CLIENT_ADMIN: Tickets from accessible clients
 * - BROKER EMPLOYEES: Any ticket
 *
 * Security: Returns 404 if ticket not found OR user lacks access
 */
router.get(
  '/tickets/:id',
  requireAuth,
  validateRequest({ params: ticketIdParamSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id } = req.params as TicketIdParam

    const ticket = await getTicketById(userId, id)

    res.status(200).json(ticket)
  })
)

export default router
