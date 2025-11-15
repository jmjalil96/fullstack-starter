/**
 * createPolicy.route.ts
 * Route for creating new policies
 */

import { Router } from 'express'

import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { createPolicySchema, type CreatePolicyInput } from './createPolicy.schema.js'
import { createPolicy } from './createPolicy.service.js'

const router = Router()

/**
 * POST /api/policies
 * Create a new policy
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 *
 * Request body:
 * - policyNumber (required): Policy number - must be unique
 * - clientId (required): Client ID (company)
 * - insurerId (required): Insurer ID (insurance carrier)
 * - type (optional): Policy type/category
 * - startDate (required): Coverage start date (ISO 8601)
 * - endDate (required): Coverage end date (ISO 8601, must be > startDate)
 *
 * Returns:
 * - 201 Created: Policy created successfully (always status: PENDING)
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Role not allowed
 * - 404 Not Found: Client or insurer not found
 * - 409 Conflict: policyNumber already exists
 */
router.post(
  '/policies',
  requireAuth,
  validateRequest({ body: createPolicySchema }),
  asyncHandler(async (req, res) => {
    const userId = req.user!!.id

    // Zod validation ensures body is validated
    // Type assertion safe because validateRequest middleware has validated
    const data = req.body as CreatePolicyInput

    const policy = await createPolicy(userId, data)

    res.status(201).json(policy)
  })
)

export default router
