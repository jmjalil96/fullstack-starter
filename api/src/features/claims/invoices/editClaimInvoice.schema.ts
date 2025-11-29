/**
 * editClaimInvoice.schema.ts
 * Validation schemas for editing claim invoices
 */

import { z } from 'zod'

/**
 * Path parameters schema
 */
export const editClaimInvoiceParamsSchema = z.object({
  claimId: z.string({ message: 'ID de reclamo es requerido' }).cuid('ID de reclamo inválido'),
  invoiceId: z.string({ message: 'ID de factura es requerido' }).cuid('ID de factura inválido'),
})

/**
 * Request body schema for invoice updates
 *
 * All fields optional (partial update pattern).
 * Unknown fields are stripped.
 * At least one field must be provided.
 */
export const editClaimInvoiceBodySchema = z
  .object({
    invoiceNumber: z
      .string({ message: 'Número de factura debe ser texto' })
      .trim()
      .min(1, 'Número de factura es requerido')
      .max(50, 'Número de factura no puede exceder 50 caracteres')
      .optional(),

    providerName: z
      .string({ message: 'Nombre del proveedor debe ser texto' })
      .trim()
      .min(1, 'Nombre del proveedor es requerido')
      .max(200, 'Nombre del proveedor no puede exceder 200 caracteres')
      .optional(),

    amountSubmitted: z
      .number({ message: 'Monto presentado debe ser un número' })
      .nonnegative('Monto presentado debe ser mayor o igual a 0')
      .optional(),
  })
  .strip()
  .superRefine((data, ctx) => {
    const hasAnyValue = Object.values(data).some((v) => v !== undefined)
    if (!hasAnyValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe proporcionar al menos un campo para actualizar',
      })
    }
  })

// Infer TypeScript types
export type EditClaimInvoiceParams = z.infer<typeof editClaimInvoiceParamsSchema>
export type EditClaimInvoiceBody = z.infer<typeof editClaimInvoiceBodySchema>
