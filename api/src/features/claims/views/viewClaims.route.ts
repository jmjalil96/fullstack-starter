/**
 * viewClaims.route.ts
 * Route for viewing and listing claims
 */

import { Router } from 'express'

import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
// import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { getClaimsQuerySchema, type GetClaimsQuery } from './viewClaims.schema.js'
import { getClaims } from './viewClaims.service.js'

const router = Router()

/**
 * GET /api/claims
 * Get paginated list of claims based on user role and filters
 *
 * Query params:
 * - status (optional): Filter by claim status
 * - clientId (optional): Filter by client (broker employees only)
 * - search (optional): Search by claim number
 * - page (default: 1): Page number
 * - limit (default: 20, max: 100): Items per page
 *
 * Returns claims based on role:
 * - AFFILIATE: Only their claims
 * - CLIENT_ADMIN: Claims from accessible clients
 * - BROKER EMPLOYEES: All claims (can filter)
 */
router.get(
  '/claims',
  // TODO: UNCOMMENT BEFORE PRODUCTION!
  // requireAuth,
  validateRequest({ query: getClaimsQuerySchema }),
  asyncHandler(async (req, res) => {
    // TODO: REMOVE MOCK - Use req.user.id when requireAuth is enabled
    const userId = 'YYAICSs5cRQL1kl2syJSmzepmhWDVZ8g' // SUPER_ADMIN for testing

    // Zod validation ensures query params are validated and have defaults
    // Type assertion safe because validateRequest middleware has validated
    const query = req.query as unknown as GetClaimsQuery

    const response = await getClaims(userId, query)

    res.status(200).json(response)
  })
)

export default router
