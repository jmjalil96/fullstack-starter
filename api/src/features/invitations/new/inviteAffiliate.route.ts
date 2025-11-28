/**
 * inviteAffiliate.route.ts
 * Routes for creating affiliate invitations
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import {
  inviteAffiliateSchema,
  inviteAffiliatesBulkSchema,
  type InviteAffiliateInput,
  type InviteAffiliatesBulkInput,
} from './inviteAffiliate.schema.js'
import { inviteAffiliate, inviteAffiliatesBulk } from './inviteAffiliate.service.js'

const router = Router()

/**
 * POST /api/invitations/affiliate
 * Create a new affiliate invitation
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can invite any affiliate
 * - CLIENT_ADMIN: Can only invite affiliates from accessible clients
 * - AFFILIATE: 403 Forbidden
 *
 * Request body:
 * - affiliateId (required): ID of affiliate to invite
 * - roleId (required): Role ID to assign upon acceptance
 *
 * Returns:
 * - 201 Created: Invitation created successfully
 * - 400 Bad Request: Validation error or affiliate ineligible
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Role not allowed or no access to affiliate
 * - 404 Not Found: Affiliate or role not found
 * - 409 Conflict: Pending invitation already exists
 */
router.post(
  '/invitations/affiliate',
  requireAuth,
  validateRequest({ body: inviteAffiliateSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const data = req.body as InviteAffiliateInput

    const invitation = await inviteAffiliate(userId, data)

    res.status(201).json(invitation)
  })
)

/**
 * POST /api/invitations/affiliates/bulk
 * Bulk invite multiple affiliates
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can invite any affiliates
 * - CLIENT_ADMIN: Can only invite affiliates from accessible clients
 * - AFFILIATE: 403 Forbidden
 *
 * Request body:
 * - affiliateIds (required): Array of affiliate IDs to invite (max 50)
 * - roleId (required): Role ID to assign to all upon acceptance
 *
 * Returns:
 * - 200 OK: Bulk operation completed (may have partial failures)
 *   Response includes individual results for each affiliate
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Not authenticated
 */
router.post(
  '/invitations/affiliates/bulk',
  requireAuth,
  validateRequest({ body: inviteAffiliatesBulkSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const data = req.body as InviteAffiliatesBulkInput

    const response = await inviteAffiliatesBulk(userId, data)

    res.status(200).json(response)
  })
)

export default router
