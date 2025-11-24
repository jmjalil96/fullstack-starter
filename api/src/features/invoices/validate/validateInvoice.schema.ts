/**
 * Validation schema for invoice validation endpoint
 */

import { z } from 'zod'

/**
 * Path parameter validation for POST /api/invoices/:id/validate
 */
export const validateInvoiceParamSchema = z.object({
  id: z.string().cuid('ID de factura inválido'),
})

/**
 * Inferred TypeScript type from param schema
 */
export type ValidateInvoiceParam = z.infer<typeof validateInvoiceParamSchema>
