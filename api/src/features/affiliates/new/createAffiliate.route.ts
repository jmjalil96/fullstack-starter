/**
 * createAffiliate.route.ts
 * Route for creating new affiliates
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { createAffiliateSchema, type CreateAffiliateInput } from './createAffiliate.schema.js'
import { createAffiliate } from './createAffiliate.service.js'

const router = Router()

/**
 * POST /api/affiliates
 * Create a new affiliate
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 *
 * Request body:
 * - clientId (required): Client ID that this affiliate belongs to
 * - firstName (required): Affiliate's first name (2-200 chars)
 * - lastName (required): Affiliate's last name (2-200 chars)
 * - email (required): Contact email (valid format, max 255 chars)
 * - phone (optional): Contact phone number (max 50 chars)
 * - dateOfBirth (optional): Date of birth (ISO 8601 format)
 * - documentType (optional): Document type (max 50 chars)
 * - documentNumber (optional): Document number (max 50 chars)
 * - affiliateType (required): Type of affiliate (OWNER or DEPENDENT)
 * - coverageType (optional): Coverage type (T, TPLUS1, or TPLUSF)
 * - primaryAffiliateId (conditional): Required for DEPENDENT, forbidden for OWNER
 *
 * Returns:
 * - 201 Created: Affiliate created successfully
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Role not allowed
 * - 404 Not Found: Client not found or primary affiliate not found
 * - 409 Conflict: Email already exists for this client
 */
router.post(
  '/affiliates',
  requireAuth,
  validateRequest({ body: createAffiliateSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    // Zod validation ensures body is validated
    // Type assertion safe because validateRequest middleware has validated
    const data = req.body as CreateAffiliateInput

    const affiliate = await createAffiliate(userId, data)

    res.status(201).json(affiliate)
  })
)

export default router
