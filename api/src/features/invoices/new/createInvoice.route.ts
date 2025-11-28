/**
 * createInvoice.route.ts
 * Route for creating new invoices
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { createInvoiceSchema, type CreateInvoiceInput } from './createInvoice.schema.js'
import { createInvoice } from './createInvoice.service.js'

const router = Router()

/**
 * POST /api/invoices
 * Create a new invoice
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden
 *
 * Request body:
 * - invoiceNumber (required): Invoice number (insurer's reference)
 * - clientId (required): Client ID (company being billed)
 * - insurerId (required): Insurer ID (insurance carrier)
 * - billingPeriod (required): Billing period in YYYY-MM format
 * - totalAmount (required): Total amount from insurer
 * - taxAmount (optional): Tax amount
 * - actualAffiliateCount (required): Number of affiliates insurer claims to bill
 * - issueDate (required): Invoice issue date (ISO 8601)
 * - dueDate (optional): Payment due date (ISO 8601, must be >= issueDate)
 * - policyIds (optional): Array of policy IDs to attach (all must belong to insurer)
 *
 * Returns:
 * - 201 Created: Invoice created successfully (always status: PENDING)
 * - 400 Bad Request: Validation error or policy-insurer mismatch
 * - 401 Unauthorized: Not authenticated
 * - 403 Forbidden: Role not allowed
 * - 404 Not Found: Client, insurer, or policy not found
 */
router.post(
  '/invoices',
  requireAuth,
  validateRequest({ body: createInvoiceSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    // Zod validation ensures body is validated
    // Type assertion safe because validateRequest middleware has validated
    const data = req.body as CreateInvoiceInput

    const invoice = await createInvoice(userId, data)

    res.status(201).json(invoice)
  })
)

export default router
