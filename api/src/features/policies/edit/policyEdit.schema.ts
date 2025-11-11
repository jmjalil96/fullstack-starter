/**
 * Validation schema for policy editing endpoint (PUT /api/policies/:id)
 *
 * Validates partial updates to policies with:
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
 * Body validation schema for policy updates
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
export const policyUpdateSchema = z
  .object({
    /** Policy number (unique identifier, uppercased) */
    policyNumber: z
      .string({ message: 'El número de póliza debe ser texto' })
      .trim()
      .toUpperCase()
      .min(3, 'El número de póliza debe tener al menos 3 caracteres')
      .max(50, 'El número de póliza no puede exceder 50 caracteres')
      .optional(),

    /** Client ID (company this policy is for) */
    clientId: z
      .string()
      .cuid('ID de cliente inválido')
      .optional(),

    /** Insurer ID (insurance carrier) */
    insurerId: z
      .string()
      .cuid('ID de aseguradora inválido')
      .optional(),

    /** Policy type/category (can be null to clear) */
    type: z
      .string({ message: 'El tipo debe ser texto' })
      .trim()
      .min(1)
      .max(100, 'El tipo no puede exceder 100 caracteres')
      .nullable()
      .optional(),

    /** Ambulatory copay amount (must be >= 0, can be null to clear) */
    ambCopay: z
      .number({ message: 'El copago ambulatorio debe ser un número' })
      .nonnegative('El copago ambulatorio debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Hospitalization copay amount (must be >= 0, can be null to clear) */
    hospCopay: z
      .number({ message: 'El copago hospitalario debe ser un número' })
      .nonnegative('El copago hospitalario debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Maternity coverage amount (must be >= 0, can be null to clear) */
    maternity: z
      .number({ message: 'La cobertura de maternidad debe ser un número' })
      .nonnegative('La cobertura de maternidad debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Premium for T coverage tier (must be >= 0, can be null to clear) */
    tPremium: z
      .number({ message: 'La prima T debe ser un número' })
      .nonnegative('La prima T debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Premium for T+1 coverage tier (must be >= 0, can be null to clear) */
    tplus1Premium: z
      .number({ message: 'La prima T+1 debe ser un número' })
      .nonnegative('La prima T+1 debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Premium for T+F (family) coverage tier (must be >= 0, can be null to clear) */
    tplusfPremium: z
      .number({ message: 'La prima T+F debe ser un número' })
      .nonnegative('La prima T+F debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Tax rate as decimal (0-1, can be null to clear) */
    taxRate: z
      .number({ message: 'La tasa de impuesto debe ser un número' })
      .min(0, 'La tasa de impuesto debe ser mayor o igual a 0')
      .max(1, 'La tasa de impuesto debe ser menor o igual a 1')
      .nullable()
      .optional(),

    /** Additional costs (must be >= 0, can be null to clear) */
    additionalCosts: z
      .number({ message: 'Los costos adicionales deben ser un número' })
      .nonnegative('Los costos adicionales deben ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Coverage period start date (ISO 8601 date string) */
    startDate: z
      .coerce
      .date({ message: 'Fecha de inicio inválida (use formato ISO 8601)' })
      .optional(),

    /** Coverage period end date (ISO 8601 date string) */
    endDate: z
      .coerce
      .date({ message: 'Fecha de fin inválida (use formato ISO 8601)' })
      .optional(),

    /** New policy status (triggers lifecycle validation) */
    status: z
      .enum(['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'], {
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
export type PolicyUpdateInput = z.input<typeof policyUpdateSchema>

/**
 * Output type (post-parse) - What service layer receives
 * Dates are coerced to Date objects by Zod
 */
export type PolicyUpdateParsed = z.output<typeof policyUpdateSchema>
