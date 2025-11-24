/**
 * viewAffiliates.route.ts
 * Route for viewing and listing affiliates
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { affiliateIdParamSchema, type AffiliateIdParam } from './affiliateDetail.schema.js'
import { getAffiliateById } from './affiliateDetail.service.js'
import { getAffiliatesQuerySchema, type GetAffiliatesQuery } from './viewAffiliates.schema.js'
import { getAffiliates } from './viewAffiliates.service.js'

const router = Router()

/**
 * GET /api/affiliates
 * Get paginated list of affiliates with filters
 *
 * Query params:
 * - clientId (optional): Filter by client
 * - search (optional): Search by first name, last name, document number, or client name
 * - affiliateType (optional): Filter by affiliate type (OWNER, DEPENDENT)
 * - coverageType (optional): Filter by coverage type (T, TPLUS1, TPLUSF)
 * - isActive (optional): Filter by active status
 * - page (default: 1): Page number
 * - limit (default: 20, max: 100): Items per page
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can view all affiliates
 * - CLIENT_ADMIN: Can view affiliates from accessible clients only
 * - AFFILIATE: 403 Forbidden
 */
router.get(
  '/affiliates',
  requireAuth,
  validateRequest({ query: getAffiliatesQuerySchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    // Zod validation ensures query params are validated and have defaults
    // Type assertion safe because validateRequest middleware has validated
    const query = req.query as unknown as GetAffiliatesQuery

    const response = await getAffiliates(userId, query)

    res.status(200).json(response)
  })
)

/**
 * GET /api/affiliates/:id
 * Get complete affiliate detail by ID with role-based authorization
 *
 * Returns detailed affiliate information based on role:
 * - BROKER_EMPLOYEES: Any affiliate
 * - CLIENT_ADMIN: Affiliates from accessible clients only
 * - AFFILIATE: 403 Forbidden
 *
 * Security: Returns 404 if affiliate not found OR user lacks access
 */
router.get(
  '/affiliates/:id',
  requireAuth,
  validateRequest({ params: affiliateIdParamSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id } = req.params as AffiliateIdParam

    const affiliate = await getAffiliateById(userId, id)

    res.status(200).json(affiliate)
  })
)

export default router
