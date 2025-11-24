/**
 * clients.route.ts
 * Route for fetching available clients for affiliate creation
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'

import { getAvailableClients } from './clients.service.js'

const router = Router()

/**
 * GET /api/affiliates/available-clients
 * Get available clients for affiliate creation
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 */
router.get(
  '/affiliates/available-clients',
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
