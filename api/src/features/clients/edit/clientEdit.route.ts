/**
 * clientEdit.route.ts
 * Route for updating clients
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'
import { clientIdParamSchema, type ClientIdParam } from '../views/clientDetail.schema.js'

import { updateClientSchema, type UpdateClientInput } from './clientEdit.schema.js'
import { updateClient } from './clientEdit.service.js'

const router = Router()

/**
 * PUT /api/clients/:id
 * Update a client with partial updates
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 *
 * Request body (all optional, partial update):
 * - name: Client company name
 * - taxId: Tax ID (must be unique if changed)
 * - email: Primary contact email (null to clear)
 * - phone: Primary contact phone (null to clear)
 * - address: Business address (null to clear)
 * - isActive: Active status
 *
 * Returns:
 * - 200 OK: Client updated successfully
 * - 400 Bad Request: Validation error or empty update
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Role not allowed
 * - 404 Not Found: Client not found
 * - 409 Conflict: taxId already exists
 */
router.put(
  '/clients/:id',
  requireAuth,
  validateRequest({ params: clientIdParamSchema, body: updateClientSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id } = req.params as ClientIdParam
    const updates = req.body as UpdateClientInput

    const client = await updateClient(userId, id, updates)

    res.status(200).json(client)
  })
)

export default router
