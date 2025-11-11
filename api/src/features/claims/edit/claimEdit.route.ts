/**
 * claimEdit.route.ts
 * Route for updating claims with lifecycle validation
 */

import { Router } from 'express'

import { env } from '../../../config/env.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
// import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'
import { claimIdParamSchema } from '../views/claimDetail.schema.js'

import { claimUpdateSchema } from './claimEdit.schema.js'
import { updateClaim } from './claimEdit.service.js'

const router = Router()

/**
 * PUT /api/claims/:id
 * Update claim with strict lifecycle validation
 *
 * Authorization:
 * - Only SENIOR_CLAIM_MANAGERS (SUPER_ADMIN, CLAIMS_EMPLOYEE) can edit SUBMITTED/UNDER_REVIEW
 * - Only SUPER_ADMIN can access APPROVED/REJECTED terminal states
 * - Other roles (AFFILIATE, CLIENT_ADMIN, other employees) cannot edit
 *
 * Workflow (strict two-step):
 * - Only fields editable in CURRENT status can be updated
 * - Status transitions validated by lifecycle blueprint
 * - Transition requirements checked against merged state
 *
 * Validation layers:
 * 1. Zod schema (type, format, constraints)
 * 2. Role-based permission (can user edit this status?)
 * 3. Field restrictions (is field editable in current status?)
 * 4. Status transitions (is transition allowed?)
 * 5. Transition requirements (are required fields present?)
 *
 * Returns:
 * - 200: Updated claim (ClaimDetailResponse)
 * - 400: Validation error (forbidden fields, invalid transition, missing requirements)
 * - 401: User not authenticated
 * - 403: User role cannot edit claims in this status
 * - 404: Claim not found
 */
router.put(
  '/claims/:id',
  // TODO: UNCOMMENT BEFORE PRODUCTION!
  // requireAuth,
  validateRequest({ params: claimIdParamSchema, body: claimUpdateSchema }),
  asyncHandler(async (req, res) => {
    // TODO: REMOVE MOCK - Use req.user.id when requireAuth is enabled
    const userId = env.TEST_USER_ID // Mock user for testing (remove in production)

    const { id } = req.params
    const updates = req.body // Already validated and parsed by Zod (dates are Date objects)

    const updated = await updateClaim(userId, id, updates)

    res.status(200).json(updated)
  })
)

export default router
