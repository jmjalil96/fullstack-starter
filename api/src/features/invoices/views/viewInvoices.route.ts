/**
 * viewInvoices.route.ts
 * Route for viewing and listing invoices
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { invoiceIdParamSchema, type InvoiceIdParam } from './invoiceDetail.schema.js'
import { getInvoiceById } from './invoiceDetail.service.js'
import { getInvoicesQuerySchema, type GetInvoicesQuery } from './viewInvoices.schema.js'
import { getInvoices } from './viewInvoices.service.js'

const router = Router()

/**
 * GET /api/invoices
 * Get paginated list of invoices with filters
 *
 * Query params:
 * - status (optional): Filter by invoice status (PENDING, VALIDATED, DISCREPANCY, CANCELLED)
 * - paymentStatus (optional): Filter by payment status (PENDING_PAYMENT, PAID)
 * - clientId (optional): Filter by client
 * - insurerId (optional): Filter by insurer
 * - search (optional): Search by invoice number (case-insensitive, min 3 chars)
 * - page (default: 1): Page number
 * - limit (default: 20, max: 100): Items per page
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can view all invoices
 * - CLIENT_ADMIN: Can view invoices from accessible clients only
 * - AFFILIATE: 403 Forbidden
 */
router.get(
  '/invoices',
  requireAuth,
  validateRequest({ query: getInvoicesQuerySchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    // Zod validation ensures query params are validated and have defaults
    // Type assertion safe because validateRequest middleware has validated
    const query = req.query as unknown as GetInvoicesQuery

    const response = await getInvoices(userId, query)

    res.status(200).json(response)
  })
)

/**
 * GET /api/invoices/:id
 * Get complete invoice detail by ID with role-based authorization
 *
 * Returns detailed invoice information based on role:
 * - BROKER_EMPLOYEES: Any invoice
 * - CLIENT_ADMIN: Invoices from accessible clients only
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can view any invoice
 * - CLIENT_ADMIN: Can view invoices from accessible clients only
 * - AFFILIATE: 403 Forbidden
 *
 * Security: Returns 404 if invoice not found OR user lacks access
 */
router.get(
  '/invoices/:id',
  requireAuth,
  validateRequest({ params: invoiceIdParamSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id } = req.params as InvoiceIdParam

    const invoice = await getInvoiceById(userId, id)

    res.status(200).json(invoice)
  })
)

export default router
