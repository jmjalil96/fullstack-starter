/**
 * clients.route.ts
 * Route for fetching available clients for ticket creation
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'

import { getAvailableClients } from './clients.service.js'

const router = Router()

/**
 * GET /api/tickets/available-clients
 * Get available clients for ticket creation
 *
 * Authorization by role:
 * - BROKER_EMPLOYEES: All active clients
 * - CLIENT_ADMIN: Their accessible clients
 * - AFFILIATE: Only their single client
 */
router.get(
  '/tickets/available-clients',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const clients = await getAvailableClients(userId)

    res.status(200).json(clients)
  })
)

export default router
