/**
 * removeClaimInvoice.route.ts
 * Route for removing invoices from claims
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { removeClaimInvoiceParamsSchema } from './removeClaimInvoice.schema.js'
import { removeClaimInvoice } from './removeClaimInvoice.service.js'

const router = Router()

/**
 * DELETE /api/claims/:claimId/invoices/:invoiceId
 * Remove an invoice from a claim
 *
 * Authorization:
 * - Only SENIOR_CLAIM_MANAGERS can remove invoices
 *
 * Returns:
 * - 200: Success message
 * - 400: Validation error
 * - 401: User not authenticated
 * - 403: User cannot remove invoices or claim is in terminal state
 * - 404: Claim or invoice not found
 */
router.delete(
  '/claims/:claimId/invoices/:invoiceId',
  requireAuth,
  validateRequest({ params: removeClaimInvoiceParamsSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { claimId, invoiceId } = req.params

    const result = await removeClaimInvoice(userId, claimId, invoiceId)

    res.status(200).json(result)
  })
)

export default router
