/**
 * inviteAgent.route.ts
 * Route for creating agent invitations
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { inviteAgentSchema, type InviteAgentInput } from './inviteAgent.schema.js'
import { inviteAgent } from './inviteAgent.service.js'

const router = Router()

/**
 * POST /api/invitations/agent
 * Create a new agent invitation
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 *
 * Request body:
 * - email (required): Email address for the invitation
 * - firstName (required): Agent's first name
 * - lastName (required): Agent's last name
 * - phone (optional): Agent's phone number
 * - agentCode (optional): Agent code/ID
 * - roleId (required): Role ID to assign upon acceptance
 *
 * Returns:
 * - 201 Created: Invitation created successfully
 * - 400 Bad Request: Validation error or role inactive
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Role not allowed
 * - 404 Not Found: Role not found
 * - 409 Conflict: Email already registered or pending invitation exists
 */
router.post(
  '/invitations/agent',
  requireAuth,
  validateRequest({ body: inviteAgentSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    // Zod validation ensures body is validated
    // Type assertion safe because validateRequest middleware has validated
    const data = req.body as InviteAgentInput

    const invitation = await inviteAgent(userId, data)

    res.status(201).json(invitation)
  })
)

export default router
