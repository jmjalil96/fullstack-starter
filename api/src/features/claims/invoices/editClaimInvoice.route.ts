/**
 * editClaimInvoice.route.ts
 * Route for editing claim invoices
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { editClaimInvoiceBodySchema, editClaimInvoiceParamsSchema } from './editClaimInvoice.schema.js'
import { editClaimInvoice } from './editClaimInvoice.service.js'

const router = Router()

/**
 * PATCH /api/claims/:claimId/invoices/:invoiceId
 * Edit a claim invoice
 *
 * Authorization:
 * - Only SENIOR_CLAIM_MANAGERS can edit invoices
 *
 * Returns:
 * - 200: Updated invoice
 * - 400: Validation error
 * - 401: User not authenticated
 * - 403: User cannot edit invoices or claim is in terminal state
 * - 404: Claim or invoice not found
 */
router.patch(
  '/claims/:claimId/invoices/:invoiceId',
  requireAuth,
  validateRequest({ params: editClaimInvoiceParamsSchema, body: editClaimInvoiceBodySchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { claimId, invoiceId } = req.params
    const updates = req.body

    const invoice = await editClaimInvoice(req, userId, claimId, invoiceId, updates)

    res.status(200).json(invoice)
  })
)

export default router
