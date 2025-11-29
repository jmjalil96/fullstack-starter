/**
 * Validation schema for claim invoice add/edit
 *
 * Mirrors backend validation from: api/src/features/claims/invoices/
 *
 * Key notes:
 * - Amount is stored as string in form, converted to number on submit
 * - Create mode requires all fields
 * - Edit mode allows partial updates (at least one field required)
 */

import { z } from 'zod'

/**
 * Parse amount string to number
 * Handles comma as decimal separator (Spanish locale)
 */
const parseAmount = (val: string): number => {
  const cleaned = val.replace(/[^0-9.-]/g, '').replace(',', '.')
  return parseFloat(cleaned)
}

/**
 * Validate amount string
 */
const isValidAmount = (val: string): boolean => {
  if (!val || val.trim() === '') return false
  const num = parseAmount(val)
  return !isNaN(num) && num >= 0
}

/**
 * Claim invoice form schema (for create mode - all required)
 */
export const claimInvoiceSchema = z.object({
  /** Invoice number from provider (required, 1-50 chars) */
  invoiceNumber: z
    .string({ message: 'El número de factura es requerido' })
    .trim()
    .min(1, 'El número de factura es requerido')
    .max(50, 'El número de factura no puede exceder 50 caracteres'),

  /** Medical provider name (required, 1-200 chars) */
  providerName: z
    .string({ message: 'El nombre del proveedor es requerido' })
    .trim()
    .min(1, 'El nombre del proveedor es requerido')
    .max(200, 'El nombre del proveedor no puede exceder 200 caracteres'),

  /** Amount submitted - string for form, validate as positive number */
  amountSubmitted: z
    .string({ message: 'El monto es requerido' })
    .min(1, 'El monto es requerido')
    .refine(isValidAmount, {
      message: 'El monto debe ser un número válido mayor o igual a 0',
    }),
})

/**
 * Claim invoice edit schema (partial updates)
 * At least one field must be provided
 */
export const claimInvoiceEditSchema = z
  .object({
    invoiceNumber: z
      .string({ message: 'El número de factura debe ser texto' })
      .trim()
      .min(1, 'El número de factura es requerido')
      .max(50, 'El número de factura no puede exceder 50 caracteres')
      .optional(),

    providerName: z
      .string({ message: 'El nombre del proveedor debe ser texto' })
      .trim()
      .min(1, 'El nombre del proveedor es requerido')
      .max(200, 'El nombre del proveedor no puede exceder 200 caracteres')
      .optional(),

    amountSubmitted: z
      .string({ message: 'El monto debe ser un número' })
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true
          return isValidAmount(val)
        },
        { message: 'El monto debe ser un número válido mayor o igual a 0' }
      )
      .optional(),
  })
  .strip()
  .superRefine((data, ctx) => {
    const hasAnyValue = Object.values(data).some((v) => v !== undefined && v !== '')
    if (!hasAnyValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe proporcionar al menos un campo para actualizar',
      })
    }
  })

/**
 * Inferred types from schemas
 */
export type ClaimInvoiceFormData = z.infer<typeof claimInvoiceSchema>
export type ClaimInvoiceEditFormData = z.infer<typeof claimInvoiceEditSchema>

/**
 * Convert form amount (string) to API amount (number)
 */
export function parseFormAmount(val: string): number {
  return parseAmount(val)
}

/**
 * Convert API amount (number) to form amount (string)
 */
export function formatFormAmount(val: number | null | undefined): string {
  if (val === null || val === undefined) return ''
  return val.toString()
}
