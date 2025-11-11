/**
 * viewPolicies.route.ts
 * Route for viewing and listing policies
 */

import { Router } from 'express'

import { env } from '../../../config/env.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
// import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { policyIdParamSchema, type PolicyIdParam } from './policyDetail.schema.js'
import { getPolicyById } from './policyDetail.service.js'
import { getPoliciesQuerySchema, type GetPoliciesQuery } from './viewPolicies.schema.js'
import { getPolicies } from './viewPolicies.service.js'

const router = Router()

/**
 * GET /api/policies
 * Get paginated list of policies with filters
 *
 * Query params:
 * - status (optional): Filter by policy status
 * - clientId (optional): Filter by client (CLIENT_ADMIN must have access, else 403)
 * - insurerId (optional): Filter by insurer
 * - search (optional): Search by policy number
 * - page (default: 1): Page number
 * - limit (default: 20, max: 100): Items per page
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can view all policies
 * - CLIENT_ADMIN: Can view policies from accessible clients only
 * - AFFILIATE: 403 Forbidden
 */
router.get(
  '/policies',
  // TODO: UNCOMMENT BEFORE PRODUCTION!
  // requireAuth,
  validateRequest({ query: getPoliciesQuerySchema }),
  asyncHandler(async (req, res) => {
    // TODO: REMOVE MOCK - Use req.user.id when requireAuth is enabled
    const userId = env.TEST_USER_ID // Mock user for testing (remove in production)

    // Zod validation ensures query params are validated and have defaults
    // Type assertion safe because validateRequest middleware has validated
    const query = req.query as unknown as GetPoliciesQuery

    const response = await getPolicies(userId, query)

    res.status(200).json(response)
  })
)

/**
 * GET /api/policies/:id
 * Get complete policy detail by ID with role-based authorization
 *
 * Returns detailed policy information:
 * - BROKER EMPLOYEES: Any policy
 * - CLIENT_ADMIN: Policies from accessible clients only
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can view any policy
 * - CLIENT_ADMIN: Can view policies from accessible clients only
 * - AFFILIATE: 403 Forbidden
 *
 * Security: Returns 404 if policy not found OR user lacks access
 */
router.get(
  '/policies/:id',
  // TODO: UNCOMMENT BEFORE PRODUCTION!
  // requireAuth,
  validateRequest({ params: policyIdParamSchema }),
  asyncHandler(async (req, res) => {
    // TODO: REMOVE MOCK - Use req.user.id when requireAuth is enabled
    const userId = env.TEST_USER_ID // Mock user for testing (remove in production)

    const { id } = req.params as PolicyIdParam

    const policy = await getPolicyById(userId, id)

    res.status(200).json(policy)
  })
)

export default router
