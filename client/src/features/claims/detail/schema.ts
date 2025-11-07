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
 * ISO 8601 date format validation regex
 * Accepts: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ
 */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/

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
      .optional(),

    /** Claimed amount (must be >= 0, can be null to clear) */
    amount: z
      .number({ message: 'El monto debe ser un número' })
      .nonnegative('El monto debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Approved amount after review (must be >= 0, can be null to clear) */
    approvedAmount: z
      .number({ message: 'El monto aprobado debe ser un número' })
      .nonnegative('El monto aprobado debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Policy ID covering this claim (CUID format, can be null to clear) */
    policyId: z.string().cuid('ID de póliza inválido').nullable().optional(),

    /** When the incident occurred (ISO 8601 date string) */
    incidentDate: z
      .string({ message: 'La fecha de incidente debe ser texto' })
      .regex(ISO_DATE_REGEX, 'Formato de fecha inválido (use YYYY-MM-DD)')
      .optional(),

    /** When the claim was submitted (ISO 8601 date string, manual entry) */
    submittedDate: z
      .string({ message: 'La fecha de envío debe ser texto' })
      .regex(ISO_DATE_REGEX, 'Formato de fecha inválido (use YYYY-MM-DD)')
      .optional(),

    /** When the claim was resolved (ISO 8601 date string) */
    resolvedDate: z
      .string({ message: 'La fecha de resolución debe ser texto' })
      .regex(ISO_DATE_REGEX, 'Formato de fecha inválido (use YYYY-MM-DD)')
      .optional(),

    /** Claim type/category (can be null to clear) */
    type: z.string({ message: 'El tipo debe ser texto' }).trim().nullable().optional(),

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
