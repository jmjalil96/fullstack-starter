/**
 * createClient.route.ts
 * Route for creating new clients
 */

import { Router } from 'express'

import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
// import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { createClientSchema, type CreateClientInput } from './createClient.schema.js'
import { createClient } from './createClient.service.js'

const router = Router()

/**
 * POST /api/clients
 * Create a new client
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 *
 * Request body:
 * - name (required): Client company name
 * - taxId (required): Tax ID (RUC/NIT) - must be unique, 8-20 digits
 * - email (optional): Primary contact email
 * - phone (optional): Primary contact phone
 * - address (optional): Business address
 *
 * Returns:
 * - 201 Created: Client created successfully
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Role not allowed
 * - 409 Conflict: taxId already exists
 */
router.post(
  '/clients',
  // TODO: UNCOMMENT BEFORE PRODUCTION!
  // requireAuth,
  validateRequest({ body: createClientSchema }),
  asyncHandler(async (req, res) => {
    // TODO: REMOVE MOCK - Use req.user.id when requireAuth is enabled
    const userId = 'YYAICSs5cRQL1kl2syJSmzepmhWDVZ8g' // SUPER_ADMIN for testing

    // Zod validation ensures body is validated
    // Type assertion safe because validateRequest middleware has validated
    const data = req.body as CreateClientInput

    const client = await createClient(userId, data)

    res.status(201).json(client)
  })
)

export default router
