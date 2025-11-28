/**
 * affiliates.route.ts
 * Route for fetching available affiliates for claim creation
 */

import { Router } from 'express'
import { z } from 'zod'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { getAvailableAffiliates } from './affiliates.service.js'

const router = Router()

/**
 * Query schema for affiliates lookup
 */
const querySchema = z.object({
  clientId: z.string().cuid('ID de cliente inválido'),
})

/**
 * GET /api/claims/available-affiliates
 * Get available affiliates for a specific client
 *
 * Authorization by role:
 * - BROKER_EMPLOYEES: All OWNER affiliates for the client
 * - CLIENT_ADMIN: All OWNER affiliates for the client (if they have access)
 * - AFFILIATE: ONLY themselves (security restriction)
 */
router.get(
  '/claims/available-affiliates',
  requireAuth,
  validateRequest({ query: querySchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id
    const { clientId } = req.query as z.infer<typeof querySchema>

    const affiliates = await getAvailableAffiliates(userId, clientId)

    res.status(200).json(affiliates)
  })
)

export default router
