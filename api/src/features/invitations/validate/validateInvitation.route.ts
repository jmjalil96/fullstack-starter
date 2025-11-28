/**
 * validateInvitation.route.ts
 * Route for validating invitation tokens (PUBLIC - no auth required)
 */

import { Router } from 'express'

import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'

import { validateInvitation } from './validateInvitation.service.js'

const router = Router()

/**
 * GET /api/invitations/:token/validate
 * Validate an invitation token (PUBLIC - no authentication required)
 *
 * This endpoint is called by the frontend when user clicks the invitation link.
 * It checks if the token is valid before showing the signup form.
 *
 * URL parameters:
 * - token (required): The invitation token from the email link
 *
 * Returns:
 * - 200 OK: Validation result (always returns 200, check 'valid' field)
 *   - valid: true → Show signup form with email pre-filled
 *   - valid: false → Show error message from 'reason' field
 *
 * Note: This endpoint intentionally does NOT use 404 for invalid tokens
 * to prevent token enumeration attacks. Always returns 200 with valid: false.
 */
router.get(
  '/invitations/:token/validate',
  asyncHandler(async (req, res) => {
    const { token } = req.params

    // Validate token format (should be 64 hex characters)
    if (token.length !== 64 || !/^[a-f0-9]+$/i.test(token)) {
      // Return invalid response instead of 400 to prevent enumeration
      res.json({
        valid: false,
        email: null,
        type: null,
        name: null,
        expiresAt: null,
        reason: 'Token de invitación inválido',
      })
      return
    }

    const result = await validateInvitation(token)

    res.json(result)
  })
)

export default router
