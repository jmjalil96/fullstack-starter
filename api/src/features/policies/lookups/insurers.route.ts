/**
 * insurers.route.ts
 * Route for fetching available insurers
 */

import { Router } from 'express'

import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'

import { getAvailableInsurers } from './insurers.service.js'

const router = Router()

/**
 * GET /api/policies/available-insurers
 * Get available insurers for policy creation
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 */
router.get(
  '/policies/available-insurers',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const userId = _req.user!.id

    const insurers = await getAvailableInsurers(userId)

    res.status(200).json(insurers)
  })
)

export default router
