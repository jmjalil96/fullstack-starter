/**
 * owners.route.ts
 * Route for fetching available owner affiliates for primary affiliate selection
 */

import { Router } from 'express'

import { env } from '../../../config/env.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
// import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { getAvailableOwnersSchema, type GetAvailableOwnersQuery } from './owners.schema.js'
import { getAvailableOwners } from './owners.service.js'

const router = Router()

/**
 * GET /api/affiliates/available-owners
 * Get available owner affiliates for primary affiliate selection
 *
 * Query params:
 * - clientId (required): Client ID to filter owners
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 */
router.get(
  '/affiliates/available-owners',
  // TODO: UNCOMMENT BEFORE PRODUCTION!
  // requireAuth,
  validateRequest({ query: getAvailableOwnersSchema }),
  asyncHandler(async (req, res) => {
    // TODO: REMOVE MOCK - Use req.user.id when requireAuth is enabled
    const userId = env.TEST_USER_ID // Mock user for testing (remove in production)

    // Zod validation ensures query params are validated
    // Type assertion safe because validateRequest middleware has validated
    const query = req.query as unknown as GetAvailableOwnersQuery

    const owners = await getAvailableOwners(userId, query)

    res.status(200).json(owners)
  })
)

export default router
