/**
 * availablePolicies.route.ts
 * Route for retrieving policies available for a specific claim
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { availablePoliciesParamSchema } from './availablePolicies.schema.js'
import { getAvailablePolicies } from './availablePolicies.service.js'

const router = Router()

/**
 * GET /api/claims/:claimId/available-policies
 * Get policies available for assignment to a claim
 *
 * Returns policies where:
 * - Policy belongs to claim's client
 * - Claim's affiliate is covered under the policy (PolicyAffiliate join)
 * - Policy is active and not expired (status=ACTIVE, endDate >= now)
 *
 * Authorization:
 * - Inherits claim access control
 * - AFFILIATE: Can only access their own claims
 * - CLIENT_ADMIN: Can only access accessible clients' claims
 * - BROKER employees: Can access any claim
 *
 * Returns empty array if no policies available (valid scenario).
 * Returns 404 if claim not found or user has no access.
 */
router.get(
  '/claims/:claimId/available-policies',
  requireAuth,
  validateRequest({ params: availablePoliciesParamSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { claimId } = req.params

    const policies = await getAvailablePolicies(userId, claimId)

    res.status(200).json(policies)
  })
)

export default router
