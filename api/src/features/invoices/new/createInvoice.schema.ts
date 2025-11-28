/**
 * Validation schema for creating invoices
 */

import { z } from 'zod'

/**
 * Request body validation for POST /api/invoices
 *
 * If policyIds provided, all policies must belong to the specified insurer.
 * Dates must be valid ISO 8601 format.
 * Unknown fields are stripped.
 */
export const createInvoiceSchema = z
  .object({
    /** Invoice number (insurer's reference) */
    invoiceNumber: z
      .string({ message: 'El número de factura es requerido' })
      .trim()
      .min(1, 'El número de factura debe tener al menos 1 caracter')
      .max(100, 'El número de factura no puede exceder 100 caracteres'),

    /** Client ID (company being billed) */
    clientId: z
      .string({ message: 'El cliente es requerido' })
      .cuid('ID de cliente inválido'),

    /** Insurer ID (insurance carrier issuing invoice) */
    insurerId: z
      .string({ message: 'La aseguradora es requerida' })
      .cuid('ID de aseguradora inválido'),

    /** Billing period (e.g., "2025-01" for January 2025) */
    billingPeriod: z
      .string({ message: 'El período de facturación es requerido' })
      .trim()
      .regex(/^\d{4}-\d{2}$/, 'El período debe estar en formato YYYY-MM (ej: 2025-01)')
      .max(7, 'El período no puede exceder 7 caracteres'),

    /** Total amount from insurer */
    totalAmount: z
      .number({ message: 'El monto total es requerido' })
      .positive('El monto total debe ser mayor a 0'),

    /** Tax amount (optional) */
    taxAmount: z
      .number()
      .nonnegative('El monto de impuesto debe ser mayor o igual a 0')
      .optional(),

    /** Number of affiliates insurer claims to be billing */
    actualAffiliateCount: z
      .number({ message: 'El número de afiliados es requerido' })
      .int('El número de afiliados debe ser un entero')
      .nonnegative('El número de afiliados debe ser mayor o igual a 0'),

    /** Invoice issue date (ISO 8601) */
    issueDate: z
      .coerce
      .date({ message: 'Fecha de emisión inválida (use formato ISO 8601)' }),

    /** Payment due date (ISO 8601, optional) */
    dueDate: z
      .coerce
      .date({ message: 'Fecha de vencimiento inválida (use formato ISO 8601)' })
      .optional(),

    /** Policy IDs to attach to this invoice (optional) */
    policyIds: z
      .array(z.string().cuid('ID de póliza inválido'))
      .min(1, 'Si provee pólizas, debe incluir al menos una')
      .optional(),
  })
  .strip()
  .refine(
    (data) => {
      // If dueDate provided, it must be >= issueDate
      if (data.dueDate) {
        return data.dueDate >= data.issueDate
      }
      return true
    },
    {
      message: 'La fecha de vencimiento debe ser igual o posterior a la fecha de emisión',
      path: ['dueDate'],
    }
  )

/**
 * Inferred TypeScript type from schema
 */
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
