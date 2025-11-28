/**
 * viewUsers.route.ts
 * Route for viewing and listing users
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { getUsersQuerySchema, type GetUsersQuery } from './viewUsers.schema.js'
import { getUsers } from './viewUsers.service.js'

const router = Router()

/**
 * GET /api/users
 * Get paginated list of users with filters
 *
 * Query params:
 * - search (optional): Search by email or name (case-insensitive, partial match)
 * - type (optional): Filter by user type (EMPLOYEE, AGENT, AFFILIATE, SYSTEM)
 * - roleId (optional): Filter by role ID
 * - isActive (optional): Filter by active status
 * - page (default: 1): Page number
 * - limit (default: 20, max: 100): Items per page
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can view all users
 * - CLIENT_ADMIN, AFFILIATE: 403 Forbidden
 */
router.get(
  '/users',
  requireAuth,
  validateRequest({ query: getUsersQuerySchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const query = req.query as unknown as GetUsersQuery

    const response = await getUsers(userId, query)

    res.status(200).json(response)
  })
)

export default router
