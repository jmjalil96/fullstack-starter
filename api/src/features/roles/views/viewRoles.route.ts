/**
 * viewRoles.route.ts
 * Route for viewing and listing roles
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'

import { getRoles } from './viewRoles.service.js'

const router = Router()

/**
 * GET /api/roles
 * Get list of all active roles
 *
 * Authorization:
 * - BROKER_EMPLOYEES only: Can view all roles
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 */
router.get(
  '/roles',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const response = await getRoles(userId)

    res.status(200).json(response)
  })
)

export default router
