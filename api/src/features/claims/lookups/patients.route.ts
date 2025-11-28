/**
 * patients.route.ts
 * Route for fetching available patients for claim creation
 */

import { Router } from 'express'
import { z } from 'zod'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { getAvailablePatients } from './patients.service.js'

const router = Router()

/**
 * Query schema for patients lookup
 */
const querySchema = z.object({
  affiliateId: z.string().cuid('ID de afiliado inválido'),
})

/**
 * GET /api/claims/available-patients
 * Get available patients for a specific affiliate
 *
 * Authorization by role:
 * - BROKER_EMPLOYEES: Any affiliate's patients
 * - CLIENT_ADMIN: Any affiliate's patients (if they have access to the client)
 * - AFFILIATE: ONLY their own affiliate's patients (security restriction)
 */
router.get(
  '/claims/available-patients',
  requireAuth,
  validateRequest({ query: querySchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id
    const { affiliateId } = req.query as z.infer<typeof querySchema>

    const patients = await getAvailablePatients(userId, affiliateId)

    res.status(200).json(patients)
  })
)

export default router
