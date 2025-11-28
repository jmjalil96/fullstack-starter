/**
 * insurerEdit.route.ts
 * Route for updating insurers
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import {
  insurerIdParamSchema,
  updateInsurerSchema,
  type InsurerIdParam,
  type UpdateInsurerParsed,
} from './insurerEdit.schema.js'
import { updateInsurer } from './insurerEdit.service.js'

const router = Router()

/**
 * PUT /api/insurers/:id
 * Update an insurer
 *
 * Path params:
 * - id: Insurer ID (CUID)
 *
 * Request body (all optional, at least one required):
 * - name: Insurer name (must be unique if provided)
 * - code: Short code (must be unique if provided, can be null to clear)
 * - email: Contact email (can be null to clear)
 * - phone: Contact phone (can be null to clear)
 * - website: Website URL (can be null to clear)
 * - isActive: Whether insurer is active
 *
 * Authorization:
 * - BROKER_EMPLOYEES only (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 */
router.put(
  '/insurers/:id',
  requireAuth,
  validateRequest({
    params: insurerIdParamSchema,
    body: updateInsurerSchema,
  }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id } = req.params as InsurerIdParam
    const updates = req.body as UpdateInsurerParsed

    const insurer = await updateInsurer(userId, id, updates)

    res.status(200).json(insurer)
  })
)

export default router
