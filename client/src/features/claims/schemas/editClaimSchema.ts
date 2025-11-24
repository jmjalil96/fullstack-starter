/**
 * Validation schema for claim editing
 *
 * Mirrors backend validation from: api/src/features/claims/edit/claimEdit.schema.ts
 *
 * Key differences from backend:
 * - Dates kept as strings (not coerced to Date objects)
 * - Frontend sends ISO 8601 strings, backend parses them
 *
 * Used by:
 * - EditClaimModal form validation (react-hook-form)
 */

import { z } from 'zod'

/**
 * Validate ISO date string represents a real date
 */
const isValidISODate = (val?: string): boolean => {
  if (!val || val.trim() === '') return true
  const date = new Date(val)
  return !isNaN(date.getTime()) && val.includes('-')
}

/**
 * Claim update validation schema
 *
 * All fields optional (partial update pattern).
 * Null values allowed (clear fields).
 * At least one field must be provided (empty updates rejected).
 */
export const claimUpdateSchema = z
  .object({
    /** Claim description/narrative (3-5000 chars, can be null to clear) */
    description: z
      .string({ message: 'La descripción debe ser texto' })
      .trim()
      .min(3, 'La descripción debe tener al menos 3 caracteres')
      .max(5000, 'La descripción no puede exceder 5000 caracteres')
      .nullable()
      .optional()
      .or(z.literal('')),

    /** Claimed amount (string in form, converted to number in mapper) */
    amount: z
      .string({ message: 'El monto debe ser un número' })
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true
          const cleaned = val.replace(/[^0-9.-]/g, '').replace(',', '.')
          const num = parseFloat(cleaned)
          return !isNaN(num) && num >= 0
        },
        { message: 'El monto debe ser un número válido mayor o igual a 0' }
      ),

    /** Approved amount (string in form, converted to number in mapper) */
    approvedAmount: z
      .string({ message: 'El monto aprobado debe ser un número' })
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true
          const cleaned = val.replace(/[^0-9.-]/g, '').replace(',', '.')
          const num = parseFloat(cleaned)
          return !isNaN(num) && num >= 0
        },
        { message: 'El monto aprobado debe ser un número válido mayor o igual a 0' }
      ),

    /** Policy ID covering this claim (CUID format, can be null to clear) */
    policyId: z.string().cuid('ID de póliza inválido').nullable().optional().or(z.literal('')),

    /** When the incident occurred (ISO 8601 date string) */
    incidentDate: z
      .string({ message: 'La fecha de incidente debe ser texto' })
      .optional()
      .refine(isValidISODate, { message: 'Fecha inválida' }),

    /** When the claim was submitted (ISO 8601 date string, manual entry) */
    submittedDate: z
      .string({ message: 'La fecha de envío debe ser texto' })
      .optional()
      .refine(isValidISODate, { message: 'Fecha inválida' }),

    /** When the claim was resolved (ISO 8601 date string) */
    resolvedDate: z
      .string({ message: 'La fecha de resolución debe ser texto' })
      .optional()
      .refine(isValidISODate, { message: 'Fecha inválida' }),

    /** Claim type/category (can be null to clear) */
    type: z.string({ message: 'El tipo debe ser texto' }).trim().nullable().optional().or(z.literal('')),

    /** New claim status (triggers lifecycle validation) */
    status: z
      .enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'], {
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
 * Should match ClaimUpdateRequest from types
 */
export type ClaimUpdateFormData = z.infer<typeof claimUpdateSchema>
