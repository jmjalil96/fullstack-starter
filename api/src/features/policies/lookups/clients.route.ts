/**
 * clients.route.ts
 * Route for fetching available clients
 */

import { Router } from 'express'

import { env } from '../../../config/env.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
// import { requireAuth } from '../../../shared/middleware/requireAuth.js'

import { getAvailableClients } from './clients.service.js'

const router = Router()

/**
 * GET /api/policies/available-clients
 * Get available clients for policy creation
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 */
router.get(
  '/policies/available-clients',
  // TODO: UNCOMMENT BEFORE PRODUCTION!
  // requireAuth,
  asyncHandler(async (_req, res) => {
    // TODO: REMOVE MOCK - Use req.user.id when requireAuth is enabled
    const userId = env.TEST_USER_ID // Mock user for testing (remove in production)

    const clients = await getAvailableClients(userId)

    res.status(200).json(clients)
  })
)

export default router
