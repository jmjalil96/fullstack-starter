/**
 * policyAffiliates.route.ts
 * Route for viewing affiliates covered under a policy
 */

import { Router } from 'express'

import { env } from '../../../config/env.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
// import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import {
  getPolicyAffiliatesQuerySchema,
  type GetPolicyAffiliatesQuery,
  policyIdParamSchema,
  type PolicyIdParam,
} from './policyAffiliates.schema.js'
import { getPolicyAffiliates } from './policyAffiliates.service.js'

const router = Router()

/**
 * GET /api/policies/:policyId/affiliates
 * Get paginated list of affiliates covered under a specific policy
 *
 * Query params:
 * - search (optional): Search by first name, last name, or document number
 * - affiliateType (optional): Filter by affiliate type (OWNER, DEPENDENT)
 * - isActive (optional): Filter by active status
 * - page (default: 1): Page number
 * - limit (default: 20, max: 100): Items per page
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can view affiliates for any policy
 * - CLIENT_ADMIN: Can view affiliates for policies from accessible clients only
 * - AFFILIATE: 403 Forbidden
 *
 * Returns affiliates covered under the policy with pagination
 */
router.get(
  '/policies/:policyId/affiliates',
  // TODO: UNCOMMENT BEFORE PRODUCTION!
  // requireAuth,
  validateRequest({ params: policyIdParamSchema, query: getPolicyAffiliatesQuerySchema }),
  asyncHandler(async (req, res) => {
    // TODO: REMOVE MOCK - Use req.user.id when requireAuth is enabled
    const userId = env.TEST_USER_ID // Mock user for testing (remove in production)

    // Zod validation ensures params and query are validated and have defaults
    // Type assertions safe because validateRequest middleware has validated
    const { policyId } = req.params as PolicyIdParam
    const query = req.query as unknown as GetPolicyAffiliatesQuery

    const response = await getPolicyAffiliates(userId, policyId, query)

    res.status(200).json(response)
  })
)

export default router
