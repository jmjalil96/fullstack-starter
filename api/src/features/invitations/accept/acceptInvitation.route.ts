/**
 * acceptInvitation.route.ts
 * Route for accepting invitation tokens (AUTHENTICATED - requires auth)
 */

import { Router } from 'express'

import { BadRequestError, UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'

import { acceptInvitation } from './acceptInvitation.service.js'

const router = Router()

/**
 * POST /api/invitations/:token/accept
 * Accept an invitation token (AUTHENTICATED - requires login)
 *
 * This endpoint is called by the frontend after user signs up.
 * It creates/links the entity and assigns the role.
 *
 * URL parameters:
 * - token (required): The invitation token from the email link
 *
 * Returns:
 * - 200 OK: Acceptance successful with user and entity info
 * - 400 Bad Request: Invalid token format, expired, or already used
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: User email doesn't match invitation email
 * - 404 Not Found: Invitation not found
 *
 * Security:
 * - CRITICAL: User's authenticated email MUST match invitation email
 * - This prevents users from accepting invitations meant for others
 */
router.post(
  '/invitations/:token/accept',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }

    const { token } = req.params

    // Basic token format validation (64 hex characters)
    if (!token || typeof token !== 'string' || token.length !== 64 || !/^[a-f0-9]+$/i.test(token)) {
      throw new BadRequestError('Token de invitación inválido')
    }

    const result = await acceptInvitation(user.id, token)

    res.json(result)
  })
)

export default router
