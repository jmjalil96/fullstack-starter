/**
 * manageInvitation.route.ts
 * Routes for managing invitations (resend, revoke)
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { invitationIdParamSchema, type InvitationIdParam } from './manageInvitation.schema.js'
import { resendInvitation } from './resendInvitation.service.js'
import { revokeInvitation } from './revokeInvitation.service.js'

const router = Router()

/**
 * POST /api/invitations/:id/resend
 * Resend a pending or expired invitation
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can resend any invitation
 * - CLIENT_ADMIN, AFFILIATE: 403 Forbidden
 *
 * Business Rules:
 * - Only PENDING or EXPIRED invitations can be resent
 * - EXPIRED invitations are reset to PENDING
 * - Expiration is extended by 7 days
 * - Email is re-sent with same token
 */
router.post(
  '/invitations/:id/resend',
  requireAuth,
  validateRequest({ params: invitationIdParamSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id } = req.params as InvitationIdParam

    const response = await resendInvitation(userId, id)

    res.status(200).json(response)
  })
)

/**
 * DELETE /api/invitations/:id
 * Revoke a pending invitation
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can revoke any invitation
 * - CLIENT_ADMIN, AFFILIATE: 403 Forbidden
 *
 * Business Rules:
 * - Only PENDING invitations can be revoked
 * - Sets status to REVOKED
 * - Token becomes invalid
 */
router.delete(
  '/invitations/:id',
  requireAuth,
  validateRequest({ params: invitationIdParamSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id } = req.params as InvitationIdParam

    const response = await revokeInvitation(userId, id)

    res.status(200).json(response)
  })
)

export default router
