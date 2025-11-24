/**
 * Validation schema for invoice detail view
 */

import { z } from 'zod'

/**
 * Path parameter validation for GET /api/invoices/:id
 */
export const invoiceIdParamSchema = z.object({
  id: z.string().cuid('ID de factura inválido'),
})

/**
 * Inferred TypeScript type from param schema
 */
export type InvoiceIdParam = z.infer<typeof invoiceIdParamSchema>
