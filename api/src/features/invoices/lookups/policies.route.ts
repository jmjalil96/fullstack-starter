/**
 * policies.route.ts
 * Route for fetching available policies for invoice creation
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { getAvailablePoliciesSchema, type GetAvailablePoliciesQuery } from './policies.schema.js'
import { getAvailablePolicies } from './policies.service.js'

const router = Router()

/**
 * GET /api/invoices/available-policies
 * Get available policies for invoice creation
 *
 * Query params:
 * - clientId (required): Client ID to filter policies
 * - insurerId (required): Insurer ID to filter policies
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 */
router.get(
  '/invoices/available-policies',
  requireAuth,
  validateRequest({ query: getAvailablePoliciesSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    // Zod validation ensures query params are validated
    // Type assertion safe because validateRequest middleware has validated
    const query = req.query as unknown as GetAvailablePoliciesQuery

    const policies = await getAvailablePolicies(userId, query)

    res.status(200).json(policies)
  })
)

export default router
