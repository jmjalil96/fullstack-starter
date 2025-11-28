/**
 * removeClaimInvoice.schema.ts
 * Validation schemas for removing invoices from claims
 */

import { z } from 'zod'

/**
 * Path parameters schema
 */
export const removeClaimInvoiceParamsSchema = z.object({
  claimId: z.string({ message: 'ID de reclamo es requerido' }).cuid('ID de reclamo inválido'),
  invoiceId: z.string({ message: 'ID de factura es requerido' }).cuid('ID de factura inválido'),
})

// Infer TypeScript type
export type RemoveClaimInvoiceParams = z.infer<typeof removeClaimInvoiceParamsSchema>
