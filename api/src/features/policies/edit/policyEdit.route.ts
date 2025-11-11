/**
 * policyEdit.route.ts
 * Route for updating policies with lifecycle validation
 */

import { Router } from 'express'

import { env } from '../../../config/env.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
// import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'
import { policyIdParamSchema } from '../views/policyDetail.schema.js'

import { policyUpdateSchema } from './policyEdit.schema.js'
import { updatePolicy } from './policyEdit.service.js'

const router = Router()

/**
 * PUT /api/policies/:id
 * Update policy with lifecycle validation
 *
 * Authorization:
 * - BROKER_EMPLOYEES can edit PENDING policies
 * - Only SUPER_ADMIN can edit ACTIVE/EXPIRED/CANCELLED policies
 * - CLIENT_ADMIN and AFFILIATE cannot edit
 *
 * Workflow:
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
 * - 200: Updated policy (PolicyDetailResponse)
 * - 400: Validation error (forbidden fields, invalid transition, missing requirements)
 * - 401: User not authenticated
 * - 403: User role cannot edit policies in this status
 * - 404: Policy not found
 * - 409: Conflict - policyNumber already exists
 */
router.put(
  '/policies/:id',
  // TODO: UNCOMMENT BEFORE PRODUCTION!
  // requireAuth,
  validateRequest({ params: policyIdParamSchema, body: policyUpdateSchema }),
  asyncHandler(async (req, res) => {
    // TODO: REMOVE MOCK - Use req.user.id when requireAuth is enabled
    const userId = env.TEST_USER_ID // Mock user for testing (remove in production)

    const { id } = req.params
    const updates = req.body // Already validated and parsed by Zod (dates are Date objects)

    const updated = await updatePolicy(userId, id, updates)

    res.status(200).json(updated)
  })
)

export default router
