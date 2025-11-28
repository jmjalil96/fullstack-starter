/**
 * viewInvitations.route.ts
 * Route for viewing and listing invitations
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { getInvitationsQuerySchema, type GetInvitationsQuery } from './viewInvitations.schema.js'
import { getInvitations } from './viewInvitations.service.js'

const router = Router()

/**
 * GET /api/invitations
 * Get paginated list of invitations with filters
 *
 * Query params:
 * - status (default: PENDING): Filter by invitation status
 * - type (optional): Filter by invitation type (EMPLOYEE, AGENT, AFFILIATE)
 * - search (optional): Search by email (case-insensitive, partial match)
 * - page (default: 1): Page number
 * - limit (default: 20, max: 100): Items per page
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can view all invitations
 * - CLIENT_ADMIN, AFFILIATE: 403 Forbidden
 */
router.get(
  '/invitations',
  requireAuth,
  validateRequest({ query: getInvitationsQuerySchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    // Zod validation ensures query params are validated and have defaults
    // Type assertion safe because validateRequest middleware has validated
    const query = req.query as unknown as GetInvitationsQuery

    const response = await getInvitations(userId, query)

    res.status(200).json(response)
  })
)

export default router
