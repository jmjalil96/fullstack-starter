/**
 * invitableAffiliates.route.ts
 * Route for fetching affiliates that can be invited
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import {
  getInvitableAffiliatesQuerySchema,
  type GetInvitableAffiliatesQuery,
} from './invitableAffiliates.schema.js'
import { getInvitableAffiliates } from './invitableAffiliates.service.js'

const router = Router()

/**
 * GET /api/affiliates/invitable
 * Get affiliates that can be invited (have email, no userId, isActive, no pending invitation)
 *
 * Query params:
 * - clientId (optional): Filter by client
 * - search (optional): Search by name, email, or document number
 * - page (default: 1): Page number
 * - limit (default: 20, max: 100): Items per page
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can view all invitable affiliates
 * - CLIENT_ADMIN: Can view invitable affiliates from accessible clients only
 * - AFFILIATE: 403 Forbidden
 */
router.get(
  '/affiliates/invitable',
  requireAuth,
  validateRequest({ query: getInvitableAffiliatesQuerySchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const query = req.query as unknown as GetInvitableAffiliatesQuery

    const response = await getInvitableAffiliates(userId, query)

    res.status(200).json(response)
  })
)

export default router
