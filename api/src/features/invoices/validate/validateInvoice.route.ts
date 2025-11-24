/**
 * validateInvoice.route.ts
 * Route for calculating invoice validation (pro-rata billing calculation)
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { validateInvoiceParamSchema, type ValidateInvoiceParam } from './validateInvoice.schema.js'
import { calculateInvoiceValidation } from './validateInvoice.service.js'

const router = Router()

/**
 * POST /api/invoices/:id/validate
 * Calculate expected amounts and affiliate counts for invoice validation
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES can run validation calculations
 * - CLIENT_ADMIN and AFFILIATE cannot access
 *
 * Process:
 * - Calculates pro-rata billing for all OWNERS (not dependents)
 * - Family tier pricing: T (single), TPLUS1 (owner+1), TPLUSF (owner+family)
 * - Handles mid-period joins/exits based on PolicyAffiliate dates
 * - Updates InvoicePolicy with per-policy breakdown
 * - Updates Invoice with aggregated totals
 * - Invoice status remains unchanged (PENDING)
 *
 * After validation:
 * - Review breakdown in response
 * - Use PUT /api/invoices/:id to transition to VALIDATED/DISCREPANCY
 * - System will compare expected vs actual and auto-determine final status
 *
 * Returns:
 * - 200: Complete invoice with calculated validation fields (InvoiceDetailResponse)
 * - 400: Invalid billing period, no policies, or cancelled invoice
 * - 401: User not authenticated
 * - 403: User role not allowed
 * - 404: Invoice not found
 *
 * Note: This is a calculation operation, not a status change.
 * Comparison and status transition happen separately in PUT endpoint.
 */
router.post(
  '/invoices/:id/validate',
  requireAuth,
  validateRequest({ params: validateInvoiceParamSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id } = req.params as ValidateInvoiceParam

    const validated = await calculateInvoiceValidation(userId, id)

    res.status(200).json(validated)
  })
)

export default router
