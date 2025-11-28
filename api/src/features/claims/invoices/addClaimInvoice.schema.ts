/**
 * addClaimInvoice.schema.ts
 * Validation schemas for adding invoices to claims
 */

import { z } from 'zod'

/**
 * Path parameters schema
 */
export const addClaimInvoiceParamsSchema = z.object({
  claimId: z.string({ message: 'ID de reclamo es requerido' }).cuid('ID de reclamo inválido'),
})

/**
 * Request body schema
 */
export const addClaimInvoiceBodySchema = z.object({
  invoiceNumber: z
    .string({ message: 'Número de factura es requerido' })
    .trim()
    .min(1, 'Número de factura es requerido')
    .max(50, 'Número de factura no puede exceder 50 caracteres'),

  providerName: z
    .string({ message: 'Nombre del proveedor es requerido' })
    .trim()
    .min(1, 'Nombre del proveedor es requerido')
    .max(200, 'Nombre del proveedor no puede exceder 200 caracteres'),

  amountSubmitted: z
    .number({ message: 'Monto presentado debe ser un número' })
    .nonnegative('Monto presentado debe ser mayor o igual a 0'),
})

// Infer TypeScript types
export type AddClaimInvoiceParams = z.infer<typeof addClaimInvoiceParamsSchema>
export type AddClaimInvoiceBody = z.infer<typeof addClaimInvoiceBodySchema>
