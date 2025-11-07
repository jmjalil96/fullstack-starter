/**
 * Validation schema for claim editing endpoint (PUT /api/claims/:id)
 *
 * Validates partial updates to claims with:
 * - Type checking (string, number, date)
 * - Format validation (CUID, ISO dates)
 * - Value constraints (min/max, nonnegative)
 * - Spanish error messages
 *
 * Note: Blueprint validation happens after Zod validation in service layer
 * (field editability, status transitions, required fields for transitions)
 */

import { z } from 'zod'

/**
 * Body validation schema for claim updates
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
    policyId: z
      .string()
      .cuid('ID de póliza inválido')
      .nullable()
      .optional(),

    /** When the incident occurred (ISO 8601 date string) */
    incidentDate: z
      .coerce
      .date({ message: 'Fecha de incidente inválida (use formato ISO 8601)' })
      .optional(),

    /** When the claim was submitted (ISO 8601 date string, manual entry) */
    submittedDate: z
      .coerce
      .date({ message: 'Fecha de envío inválida (use formato ISO 8601)' })
      .optional(),

    /** When the claim was resolved (ISO 8601 date string) */
    resolvedDate: z
      .coerce
      .date({ message: 'Fecha de resolución inválida (use formato ISO 8601)' })
      .optional(),

    /** Claim type/category (can be null to clear) */
    type: z
      .string({ message: 'El tipo debe ser texto' })
      .trim()
      .nullable()
      .optional(),

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
export type ClaimUpdateInput = z.input<typeof claimUpdateSchema>

/**
 * Output type (post-parse) - What service layer receives
 * Dates are coerced to Date objects by Zod
 */
export type ClaimUpdateParsed = z.output<typeof claimUpdateSchema>
