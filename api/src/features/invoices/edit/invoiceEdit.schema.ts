/**
 * Validation schema for invoice editing endpoint (PUT /api/invoices/:id)
 *
 * Validates partial updates to invoices with:
 * - Type checking (string, number, date)
 * - Format validation (CUID, ISO dates, billing period format)
 * - Value constraints (min/max, nonnegative)
 * - Spanish error messages
 *
 * Note: Blueprint validation happens after Zod validation in service layer
 * (field editability, status transitions, required fields for transitions)
 */

import { z } from 'zod'

/**
 * Body validation schema for invoice updates
 *
 * All fields optional (partial update pattern).
 * Unknown fields are stripped (ignored).
 * At least one field must be provided (empty updates rejected).
 *
 * Date handling:
 * - Input expects ISO 8601 strings
 * - Coerced to Date objects for service layer
 * - Use z.input<> for input type, z.output<> for parsed type
 *
 * Nullable fields:
 * - Can be set to null to clear the value
 * - Validated with .nullable().optional() chain
 */
export const updateInvoiceSchema = z
  .object({
    /** Invoice number (our internal identifier) */
    invoiceNumber: z
      .string({ message: 'El número de factura debe ser texto' })
      .trim()
      .min(3, 'El número de factura debe tener al menos 3 caracteres')
      .max(100, 'El número de factura no puede exceder 100 caracteres')
      .optional(),

    /** Insurer's invoice number (their reference) */
    insurerInvoiceNumber: z
      .string({ message: 'El número de factura de la aseguradora debe ser texto' })
      .trim()
      .min(1, 'El número de factura de la aseguradora debe tener al menos 1 caracter')
      .max(100, 'El número de factura de la aseguradora no puede exceder 100 caracteres')
      .optional(),

    /** Client ID (company being billed) */
    clientId: z.string().cuid('ID de cliente inválido').optional(),

    /** Insurer ID (insurance carrier) */
    insurerId: z.string().cuid('ID de aseguradora inválido').optional(),

    /** Billing period in YYYY-MM format */
    billingPeriod: z
      .string({ message: 'El período de facturación debe ser texto' })
      .trim()
      .regex(/^\d{4}-\d{2}$/, 'El período debe estar en formato YYYY-MM (ej: 2025-01)')
      .max(7, 'El período no puede exceder 7 caracteres')
      .nullable()
      .optional(),

    /** Total amount from insurer (must be > 0) */
    totalAmount: z
      .number({ message: 'El monto total debe ser un número' })
      .positive('El monto total debe ser mayor a 0')
      .optional(),

    /** Tax amount (must be >= 0, can be null to clear) */
    taxAmount: z
      .number({ message: 'El monto de impuesto debe ser un número' })
      .nonnegative('El monto de impuesto debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Number of affiliates from insurer (must be >= 0, can be null) */
    actualAffiliateCount: z
      .number({ message: 'El número de afiliados debe ser un número' })
      .int('El número de afiliados debe ser un entero')
      .nonnegative('El número de afiliados debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Expected amount - manual override (must be >= 0, can be null) */
    expectedAmount: z
      .number({ message: 'El monto esperado debe ser un número' })
      .nonnegative('El monto esperado debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Expected affiliate count - from validation calculation (must be >= 0, can be null) */
    expectedAffiliateCount: z
      .number({ message: 'El conteo esperado debe ser un número' })
      .int('El conteo esperado debe ser un entero')
      .nonnegative('El conteo esperado debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Notes about discrepancies or resolution (can be null to clear) */
    discrepancyNotes: z
      .string()
      .trim()
      .max(5000, 'Las notas no pueden exceder 5000 caracteres')
      .nullable()
      .optional(),

    /** Invoice issue date (ISO 8601 date string) */
    issueDate: z.coerce.date({ message: 'Fecha de emisión inválida (use formato ISO 8601)' }).optional(),

    /** Payment due date (ISO 8601 date string, can be null to clear) */
    dueDate: z
      .coerce
      .date({ message: 'Fecha de vencimiento inválida (use formato ISO 8601)' })
      .nullable()
      .optional(),

    /** Payment status */
    paymentStatus: z
      .enum(['PENDING_PAYMENT', 'PAID'], {
        message: 'Estado de pago inválido',
      })
      .optional(),

    /** Actual payment date (ISO 8601 date string, can be null to clear) */
    paymentDate: z
      .coerce
      .date({ message: 'Fecha de pago inválida (use formato ISO 8601)' })
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
    const hasAnyValue = Object.values(data).some((v) => v !== undefined)
    if (!hasAnyValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe proporcionar al menos un campo para actualizar',
      })
    }
  })

/**
 * Input type (pre-parse) - Matches DTO with ISO strings
 * This is what the client sends (dates as ISO 8601 strings)
 */
export type InvoiceUpdateInput = z.input<typeof updateInvoiceSchema>

/**
 * Output type (post-parse) - What service layer receives
 * Dates are coerced to Date objects by Zod
 */
export type InvoiceUpdateParsed = z.output<typeof updateInvoiceSchema>
