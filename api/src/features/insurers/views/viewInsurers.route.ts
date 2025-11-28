/**
 * viewInsurers.route.ts
 * Route for viewing and listing insurers
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { insurerIdParamSchema, type InsurerIdParam } from './insurerDetail.schema.js'
import { getInsurerById } from './insurerDetail.service.js'
import { getInsurersQuerySchema, type GetInsurersQuery } from './viewInsurers.schema.js'
import { getInsurers } from './viewInsurers.service.js'

const router = Router()

/**
 * GET /api/insurers
 * Get paginated list of insurers with filters
 *
 * Query params:
 * - search (optional): Search by name or code (case-insensitive, contains match)
 * - isActive (optional): Filter by active status
 * - page (default: 1): Page number
 * - limit (default: 10, max: 100): Items per page
 *
 * Authorization:
 * - BROKER_EMPLOYEES only: Can view all insurers
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 */
router.get(
  '/insurers',
  requireAuth,
  validateRequest({ query: getInsurersQuerySchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    // Zod validation ensures query params are validated and have defaults
    // Type assertion safe because validateRequest middleware has validated
    const query = req.query as unknown as GetInsurersQuery

    const response = await getInsurers(userId, query)

    res.status(200).json(response)
  })
)

/**
 * GET /api/insurers/:id
 * Get complete insurer detail by ID
 *
 * Authorization:
 * - BROKER_EMPLOYEES only: Can view any insurer
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 */
router.get(
  '/insurers/:id',
  requireAuth,
  validateRequest({ params: insurerIdParamSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id } = req.params as InsurerIdParam

    const insurer = await getInsurerById(userId, id)

    res.status(200).json(insurer)
  })
)

export default router
