/**
 * Validation schema for invoice editing
 *
 * Mirrors backend validation from: api/src/features/invoices/edit/invoiceEdit.schema.ts
 *
 * Key differences from backend:
 * - Numeric fields kept as strings (HTML inputs return strings)
 * - Dates kept as strings (not coerced to Date objects)
 * - Frontend sends ISO 8601 strings, backend parses them
 *
 * Used by:
 * - EditInvoiceModal form validation (react-hook-form)
 */

import { z } from 'zod'

/**
 * ISO 8601 date format validation regex
 * Accepts: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ
 */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/

/**
 * Billing period format validation regex
 * Accepts: YYYY-MM (e.g., "2025-01")
 */
const BILLING_PERIOD_REGEX = /^\d{4}-\d{2}$/

/**
 * Invoice update validation schema
 *
 * All fields optional (partial update pattern).
 * Null values allowed (clear fields).
 * At least one field must be provided (empty updates rejected).
 */
export const invoiceUpdateSchema = z
  .object({
    /** Invoice number (internal tracking) */
    invoiceNumber: z
      .string({ message: 'El número de factura debe ser texto' })
      .trim()
      .min(1, 'El número de factura es requerido')
      .optional(),

    /** Insurer's invoice number (from PDF/document) */
    insurerInvoiceNumber: z
      .string({ message: 'El número de aseguradora debe ser texto' })
      .trim()
      .min(1, 'El número de aseguradora es requerido')
      .optional(),

    /** Client ID (CUID) */
    clientId: z.string().cuid('ID de cliente inválido').optional(),

    /** Insurer ID (CUID) */
    insurerId: z.string().cuid('ID de aseguradora inválido').optional(),

    /** Billing period (YYYY-MM format) */
    billingPeriod: z
      .string({ message: 'El período de facturación debe ser texto' })
      .regex(BILLING_PERIOD_REGEX, 'Formato inválido (use YYYY-MM)')
      .nullable()
      .optional(),

    /** Total amount (string in form, converted to number in mapper) */
    totalAmount: z.string({ message: 'El monto total debe ser un número' }).optional(),

    /** Tax amount (string in form, converted to number in mapper, nullable) */
    taxAmount: z.string({ message: 'El impuesto debe ser un número' }).optional(),

    /** Expected amount calculated (string in form, converted to number in mapper, nullable) */
    expectedAmount: z.string({ message: 'El monto esperado debe ser un número' }).optional(),

    /** Actual affiliate count from insurer (string in form, converted to number in mapper, nullable) */
    actualAffiliateCount: z
      .string({ message: 'El conteo de afiliados debe ser un número' })
      .optional(),

    /** Issue date (ISO 8601 date string) */
    issueDate: z
      .string({ message: 'La fecha de emisión debe ser texto' })
      .regex(ISO_DATE_REGEX, 'Formato de fecha inválido (use YYYY-MM-DD)')
      .optional(),

    /** Due date (ISO 8601 date string, nullable) */
    dueDate: z
      .string({ message: 'La fecha de vencimiento debe ser texto' })
      .regex(ISO_DATE_REGEX, 'Formato de fecha inválido (use YYYY-MM-DD)')
      .optional(),

    /** Payment date (ISO 8601 date string, nullable) */
    paymentDate: z
      .string({ message: 'La fecha de pago debe ser texto' })
      .regex(ISO_DATE_REGEX, 'Formato de fecha inválido (use YYYY-MM-DD)')
      .optional(),

    /** Payment status */
    paymentStatus: z
      .enum(['PENDING_PAYMENT', 'PAID'], {
        message: 'Estado de pago inválido',
      })
      .optional(),

    /** Discrepancy notes (nullable) */
    discrepancyNotes: z
      .string({ message: 'Las notas deben ser texto' })
      .trim()
      .max(5000, 'Las notas no pueden exceder 5000 caracteres')
      .nullable()
      .optional(),

    /** New invoice status (triggers lifecycle validation) */
    status: z
      .enum(['PENDING', 'VALIDATED', 'DISCREPANCY', 'CANCELLED'], {
        message: 'Estado inválido',
      })
      .optional(),
  })
  .strip() // Ignore unknown fields
  .superRefine((data, ctx) => {
    // Reject empty updates (at least one field must have a defined value)
    // Allows null (intentional clears), rejects all-undefined
    const hasAnyValue = Object.values(data).some((v) => v !== undefined)
    if (!hasAnyValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe proporcionar al menos un campo para actualizar',
      })
    }
  })

/**
 * Inferred type from schema
 * Should match InvoiceUpdateRequest from types
 */
export type InvoiceEditFormData = z.infer<typeof invoiceUpdateSchema>
