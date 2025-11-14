/**
 * affiliateEdit.route.ts
 * Route for updating affiliates
 */

import { Router } from 'express'

import { env } from '../../../config/env.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
// import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'
import { affiliateIdParamSchema, type AffiliateIdParam } from '../views/affiliateDetail.schema.js'

import { updateAffiliateSchema } from './affiliateEdit.schema.js'
import { updateAffiliate } from './affiliateEdit.service.js'

const router = Router()

/**
 * PUT /api/affiliates/:id
 * Update an affiliate with partial updates
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 *
 * Request body (all optional, partial update):
 * - firstName: First name of the affiliate
 * - lastName: Last name of the affiliate
 * - documentType: Type of identification document (DNI, PASSPORT, etc.)
 * - documentNumber: Document number (must be unique per client if changed)
 * - email: Email address (required for OWNER type affiliates, null to clear for non-OWNER)
 * - phone: Phone number (null to clear)
 * - dateOfBirth: Date of birth
 * - gender: Gender (MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY)
 * - address: Physical address (null to clear)
 * - type: Affiliate type (OWNER, DEPENDENT)
 * - primaryAffiliateId: Required for DEPENDENT types, null for OWNER types
 * - relationship: Relationship to primary affiliate (SPOUSE, CHILD, etc.) - required for DEPENDENT
 * - isActive: Active status
 *
 * Validation:
 * - Email is required for OWNER type affiliates
 * - primaryAffiliateId is required for DEPENDENT type affiliates
 * - documentNumber must be unique per client (409 if duplicate)
 * - Cross-field validation ensures type/primaryAffiliateId/relationship consistency
 *
 * Returns:
 * - 200 OK: Affiliate updated successfully
 * - 400 Bad Request: Validation error or empty update
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Role not allowed
 * - 404 Not Found: Affiliate not found
 * - 409 Conflict: documentNumber already exists for this client
 */
router.put(
  '/affiliates/:id',
  // TODO: UNCOMMENT BEFORE PRODUCTION!
  // requireAuth,
  validateRequest({ params: affiliateIdParamSchema, body: updateAffiliateSchema }),
  asyncHandler(async (req, res) => {
    // TODO: REMOVE MOCK - Use req.user.id when requireAuth is enabled
    const userId = env.TEST_USER_ID // Mock user for testing (remove in production)

    const { id } = req.params as AffiliateIdParam
    // Use the validated/parsed body directly from the request (after validation middleware)
    const updates = req.body

    const affiliate = await updateAffiliate(userId, id, updates)

    res.status(200).json(affiliate)
  })
)

export default router
