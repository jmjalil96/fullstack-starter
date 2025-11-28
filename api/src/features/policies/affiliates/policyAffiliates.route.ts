/**
 * policyAffiliates.route.ts
 * Routes for managing affiliates in policies
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { addAffiliateToPolicySchema, type AddAffiliateToPolicyInput } from './addAffiliate.schema.js'
import { addAffiliateToPolicy } from './addAffiliate.service.js'
import {
  getPolicyAffiliatesQuerySchema,
  type GetPolicyAffiliatesQuery,
  policyIdParamSchema,
  type PolicyIdParam,
} from './policyAffiliates.schema.js'
import { getPolicyAffiliates } from './policyAffiliates.service.js'
import {
  policyAffiliateParamsSchema,
  removeAffiliateFromPolicySchema,
  type PolicyAffiliateParams,
  type RemoveAffiliateFromPolicyInput,
} from './removeAffiliate.schema.js'
import { removeAffiliateFromPolicy } from './removeAffiliate.service.js'

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
  requireAuth,
  validateRequest({ params: policyIdParamSchema, query: getPolicyAffiliatesQuerySchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    // Zod validation ensures params and query are validated and have defaults
    // Type assertions safe because validateRequest middleware has validated
    const { policyId } = req.params as PolicyIdParam
    const query = req.query as unknown as GetPolicyAffiliatesQuery

    const response = await getPolicyAffiliates(userId, policyId, query)

    res.status(200).json(response)
  })
)

/**
 * POST /api/policies/:policyId/affiliates
 * Create a new affiliate and add them to a policy
 *
 * Request body:
 * - clientId (required): Must match policy's client
 * - firstName (required): Affiliate's first name
 * - lastName (required): Affiliate's last name
 * - affiliateType (required): OWNER or DEPENDENT
 * - email (conditional): Required for OWNER, optional for DEPENDENT
 * - primaryAffiliateId (conditional): Required for DEPENDENT, forbidden for OWNER
 * - phone (optional): Contact phone
 * - dateOfBirth (optional): ISO 8601 date
 * - documentType (optional): Document type
 * - documentNumber (optional): Document number
 * - coverageType (optional): T, TPLUS1, or TPLUSF
 * - addedAt (optional): When affiliate joins policy (defaults to now)
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 *
 * Returns:
 * - 201 Created: Affiliate created and added to policy
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Role not allowed
 * - 404 Not Found: Policy or primary affiliate not found
 */
router.post(
  '/policies/:policyId/affiliates',
  requireAuth,
  validateRequest({ params: policyIdParamSchema, body: addAffiliateToPolicySchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    // Zod validation ensures params and body are validated
    // Type assertions safe because validateRequest middleware has validated
    const { policyId } = req.params as PolicyIdParam
    const data = req.body as AddAffiliateToPolicyInput

    const response = await addAffiliateToPolicy(userId, policyId, data)

    res.status(201).json(response)
  })
)

/**
 * PATCH /api/policies/:policyId/affiliates/:affiliateId
 * Remove an affiliate from a policy (soft delete)
 *
 * Request body:
 * - removedAt (required): Date when affiliate leaves the policy (ISO 8601)
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 *
 * Behavior:
 * - For OWNER: Cascades removal to all dependents on same policy
 * - Sets removedAt date and isActive = false on PolicyAffiliate
 *
 * Returns:
 * - 200 OK: Affiliate removed with cascade info
 * - 400 Bad Request: Validation error or already removed
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Role not allowed
 * - 404 Not Found: PolicyAffiliate not found
 */
router.patch(
  '/policies/:policyId/affiliates/:affiliateId',
  requireAuth,
  validateRequest({
    params: policyAffiliateParamsSchema,
    body: removeAffiliateFromPolicySchema,
  }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { policyId, affiliateId } = req.params as PolicyAffiliateParams
    const data = req.body as RemoveAffiliateFromPolicyInput

    const response = await removeAffiliateFromPolicy(userId, policyId, affiliateId, data)

    res.status(200).json(response)
  })
)

export default router
