/**
 * clients.route.ts
 * Route for fetching available clients
 */

import { Router } from 'express'

import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'

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
  requireAuth,
  asyncHandler(async (_req, res) => {
    const userId = _req.user!.id

    const clients = await getAvailableClients(userId)

    res.status(200).json(clients)
  })
)

export default router
