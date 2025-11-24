/**
 * invoiceEdit.route.ts
 * Route for updating invoices with lifecycle validation
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'
import { invoiceIdParamSchema } from '../views/invoiceDetail.schema.js'

import { updateInvoiceSchema } from './invoiceEdit.schema.js'
import { updateInvoice } from './invoiceEdit.service.js'

const router = Router()

/**
 * PUT /api/invoices/:id
 * Update invoice with lifecycle validation
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES can edit invoices
 * - CLIENT_ADMIN and AFFILIATE cannot edit
 *
 * Workflow:
 * - Only fields editable in CURRENT status can be updated
 * - Status transitions validated by lifecycle blueprint
 * - Transition requirements checked against merged state
 *
 * Automatic Status Determination:
 * - When transitioning to VALIDATED/DISCREPANCY, system compares expected vs actual
 * - Final status may differ from requested (VALIDATED if match, DISCREPANCY if mismatch)
 * - Ensures invoice status always reflects true validation state
 * - Must run validation calculation first (expected values must be populated)
 *
 * Validation layers:
 * 1. Zod schema (type, format, constraints)
 * 2. Role-based permission (can user edit this status?)
 * 3. Field restrictions (is field editable in current status?)
 * 4. Status transitions (is transition allowed?)
 * 5. Transition requirements (are required fields present?)
 *
 * Returns:
 * - 200: Updated invoice (InvoiceDetailResponse)
 * - 400: Validation error (forbidden fields, invalid transition, missing requirements)
 * - 401: User not authenticated
 * - 404: Invoice not found
 * - 409: Conflict - invoiceNumber already exists
 */
router.put(
  '/invoices/:id',
  requireAuth,
  validateRequest({ params: invoiceIdParamSchema, body: updateInvoiceSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id } = req.params
    const updates = req.body // Already validated and parsed by Zod (dates are Date objects)

    const updated = await updateInvoice(userId, id, updates)

    res.status(200).json(updated)
  })
)

export default router
