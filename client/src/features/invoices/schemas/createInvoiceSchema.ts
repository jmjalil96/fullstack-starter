/**
 * Invoice form validation schema
 * Mirrors backend: api/src/features/invoices/new/createInvoice.schema.ts
 */

import { z } from 'zod'

/**
 * Zod schema for invoice creation form
 *
 * Mirrors backend validation exactly to provide instant client-side feedback.
 * Backend will re-validate for security.
 */
export const invoiceFormSchema = z.object({
  /** Invoice number (our internal identifier) */
  invoiceNumber: z
    .string()
    .trim()
    .min(3, 'El número de factura debe tener al menos 3 caracteres')
    .max(100, 'El número de factura no puede exceder 100 caracteres'),

  /** Insurer's invoice number (their reference) */
  insurerInvoiceNumber: z
    .string()
    .trim()
    .min(1, 'El número de factura de la aseguradora es requerido')
    .max(100, 'El número de factura no puede exceder 100 caracteres'),

  /** Client ID (company being billed) */
  clientId: z
    .string()
    .min(1, 'El cliente es requerido'),

  /** Insurer ID (insurance carrier issuing invoice) */
  insurerId: z
    .string()
    .min(1, 'La aseguradora es requerida'),

  /** Billing period (e.g., "2025-01" for January 2025) */
  billingPeriod: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'El período debe tener formato YYYY-MM (ej: 2025-01)'),

  /** Total amount from insurer */
  totalAmount: z
    .string()
    .min(1, 'El monto total es requerido')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'))
      return !isNaN(num) && num > 0
    }, 'El monto debe ser un número positivo'),

  /** Tax amount (optional) */
  taxAmount: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true
      const num = parseFloat(val.replace(',', '.'))
      return !isNaN(num) && num >= 0
    }, 'El impuesto debe ser un número no negativo'),

  /** Number of affiliates insurer claims to be billing */
  actualAffiliateCount: z
    .string()
    .min(1, 'El número de afiliados facturados es requerido')
    .refine((val) => {
      const num = parseInt(val, 10)
      return !isNaN(num) && num >= 0
    }, 'El número de afiliados debe ser un entero no negativo'),

  /** Invoice issue date (ISO 8601 date string) */
  issueDate: z
    .string()
    .min(1, 'La fecha de emisión es requerida'),

  /** Payment due date (ISO 8601 date string, optional) */
  dueDate: z
    .string()
    .optional()
    .or(z.literal('')), // Allow empty string

  /** Policy IDs to attach to this invoice (optional) */
  policyIds: z
    .array(z.string())
    .optional(),
})

/**
 * Inferred TypeScript type for form data
 */
export type InvoiceFormData = z.infer<typeof invoiceFormSchema>