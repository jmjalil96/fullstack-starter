/**
 * viewClients.route.ts
 * Route for viewing and listing clients
 */

import { Router } from 'express'

import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { clientIdParamSchema, type ClientIdParam } from './clientDetail.schema.js'
import { getClientById } from './clientDetail.service.js'
import { getClientsQuerySchema, type GetClientsQuery } from './viewClients.schema.js'
import { getClients } from './viewClients.service.js'

const router = Router()

/**
 * GET /api/clients
 * Get paginated list of clients based on user role and filters
 *
 * Query params:
 * - search (optional): Search by name, taxId, or email
 * - isActive (optional): Filter by active status
 * - page (default: 1): Page number
 * - limit (default: 20, max: 100): Items per page
 *
 * Returns clients based on role:
 * - AFFILIATE: Only their own client
 * - CLIENT_ADMIN: Accessible clients
 * - BROKER EMPLOYEES: All clients (can filter)
 */
router.get(
  '/clients',
  requireAuth,
  validateRequest({ query: getClientsQuerySchema }),
  asyncHandler(async (req, res) => {
    const userId = req.user!!.id

    // Zod validation ensures query params are validated and have defaults
    // Type assertion safe because validateRequest middleware has validated
    const query = req.query as unknown as GetClientsQuery

    const response = await getClients(userId, query)

    res.status(200).json(response)
  })
)

/**
 * GET /api/clients/:id
 * Get complete client detail by ID with role-based authorization
 *
 * Returns detailed client information based on role:
 * - AFFILIATE: Only their own client
 * - CLIENT_ADMIN: Clients from accessible list
 * - BROKER EMPLOYEES: Any client
 *
 * Security: Returns 404 if client not found OR user lacks access
 */
router.get(
  '/clients/:id',
  requireAuth,
  validateRequest({ params: clientIdParamSchema }),
  asyncHandler(async (req, res) => {
    const userId = req.user!!.id

    const { id } = req.params as ClientIdParam

    const client = await getClientById(userId, id)

    res.status(200).json(client)
  })
)

export default router
