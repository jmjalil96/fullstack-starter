/**
 * createInsurer.route.ts
 * Route for creating new insurers
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { createInsurerSchema, type CreateInsurerParsed } from './createInsurer.schema.js'
import { createInsurer } from './createInsurer.service.js'

const router = Router()

/**
 * POST /api/insurers
 * Create a new insurer
 *
 * Request body:
 * - name (required): Insurer name (must be unique)
 * - code (optional): Short code (must be unique, will be uppercased)
 * - email (optional): Contact email
 * - phone (optional): Contact phone
 * - website (optional): Website URL
 *
 * Authorization:
 * - BROKER_EMPLOYEES only (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 */
router.post(
  '/insurers',
  requireAuth,
  validateRequest({ body: createInsurerSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const data = req.body as CreateInsurerParsed

    const insurer = await createInsurer(userId, data)

    res.status(201).json(insurer)
  })
)

export default router
