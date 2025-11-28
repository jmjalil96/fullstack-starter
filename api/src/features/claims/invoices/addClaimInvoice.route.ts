/**
 * addClaimInvoice.route.ts
 * Route for adding invoices to claims
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { addClaimInvoiceBodySchema, addClaimInvoiceParamsSchema } from './addClaimInvoice.schema.js'
import { addClaimInvoice } from './addClaimInvoice.service.js'

const router = Router()

/**
 * POST /api/claims/:claimId/invoices
 * Add an invoice to a claim
 *
 * Authorization:
 * - Only SENIOR_CLAIM_MANAGERS can add invoices
 *
 * Returns:
 * - 201: Created invoice
 * - 400: Validation error
 * - 401: User not authenticated
 * - 403: User cannot add invoices or claim is in terminal state
 * - 404: Claim not found
 */
router.post(
  '/claims/:claimId/invoices',
  requireAuth,
  validateRequest({ params: addClaimInvoiceParamsSchema, body: addClaimInvoiceBodySchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { claimId } = req.params
    const data = req.body

    const invoice = await addClaimInvoice(userId, claimId, data)

    res.status(201).json(invoice)
  })
)

export default router
