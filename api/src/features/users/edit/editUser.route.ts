/**
 * editUser.route.ts
 * Routes for editing users (SUPER_ADMIN only)
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { deactivateUser } from './deactivateUser.service.js'
import {
  editUserSchema,
  updateClientAccessSchema,
  userIdParamSchema,
  type EditUserInput,
  type UpdateClientAccessInput,
  type UserIdParam,
} from './editUser.schema.js'
import { editUser } from './editUser.service.js'
import { updateClientAccess } from './updateClientAccess.service.js'

const router = Router()

/**
 * PATCH /api/users/:id
 * Edit a user's information
 *
 * Authorization:
 * - SUPER_ADMIN only
 *
 * Request body:
 * - globalRoleId (optional): New role ID
 * - name (optional): New name
 *
 * Note: At least one field must be provided
 */
router.patch(
  '/users/:id',
  requireAuth,
  validateRequest({ params: userIdParamSchema, body: editUserSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id } = req.params as UserIdParam
    const data = req.body as EditUserInput

    const response = await editUser(userId, id, data)

    res.status(200).json(response)
  })
)

/**
 * PUT /api/users/:id/client-access
 * Update a user's client access
 *
 * Authorization:
 * - SUPER_ADMIN only
 *
 * Request body:
 * - clientIds: Array of client IDs to grant access to
 *
 * Note: Only affiliates can have client access
 * Note: Replaces all existing access (empty array removes all)
 */
router.put(
  '/users/:id/client-access',
  requireAuth,
  validateRequest({ params: userIdParamSchema, body: updateClientAccessSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id } = req.params as UserIdParam
    const data = req.body as UpdateClientAccessInput

    const response = await updateClientAccess(userId, id, data)

    res.status(200).json(response)
  })
)

/**
 * POST /api/users/:id/deactivate
 * Deactivate a user and their linked entity
 *
 * Authorization:
 * - SUPER_ADMIN only
 *
 * Business Logic:
 * - Sets linked entity (Employee/Agent/Affiliate) isActive = false
 * - Deletes all user sessions (force logout)
 * - Cannot deactivate yourself
 */
router.post(
  '/users/:id/deactivate',
  requireAuth,
  validateRequest({ params: userIdParamSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id } = req.params as UserIdParam

    const response = await deactivateUser(userId, id)

    res.status(200).json(response)
  })
)

export default router
