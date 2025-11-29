/**
 * newClaim.route.ts
 * Route for creating new claims
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { createClaimSchema } from './newClaim.schema.js'
import { createClaim } from './newClaim.service.js'

const router = Router()

/**
 * POST /api/claims
 * Create a new claim
 */
router.post(
  '/claims',
  requireAuth,
  validateRequest({ body: createClaimSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const claim = await createClaim(req, userId, req.body)

    res.status(201).json(claim)
  })
)

export default router
