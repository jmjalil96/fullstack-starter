/**
 * Validation schema for policy editing
 *
 * Mirrors backend validation from: api/src/features/policies/edit/policyEdit.schema.ts
 *
 * Key differences from backend:
 * - Dates kept as strings (not coerced to Date objects)
 * - Frontend sends ISO 8601 strings, backend parses them
 *
 * Used by:
 * - EditPolicyModal form validation (react-hook-form)
 */

import { z } from 'zod'

/**
 * ISO 8601 date format validation regex
 * Accepts: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ
 */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/

/**
 * Policy update validation schema
 *
 * All fields optional (partial update pattern).
 * Null values allowed (clear fields).
 * At least one field must be provided (empty updates rejected).
 */
export const policyUpdateSchema = z
  .object({
    /** Policy number (unique identifier, uppercased, 3-50 chars) */
    policyNumber: z
      .string({ message: 'El número de póliza debe ser texto' })
      .trim()
      .toUpperCase()
      .min(3, 'El número de póliza debe tener al menos 3 caracteres')
      .max(50, 'El número de póliza no puede exceder 50 caracteres')
      .optional(),

    /** Client ID (company this policy is for, CUID format) */
    clientId: z.string().cuid('ID de cliente inválido').optional(),

    /** Insurer ID (insurance carrier, CUID format) */
    insurerId: z.string().cuid('ID de aseguradora inválido').optional(),

    /** Policy type/category (1-100 chars, can be null to clear) */
    type: z
      .string({ message: 'El tipo debe ser texto' })
      .trim()
      .min(1, 'El tipo debe tener al menos 1 carácter')
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
      .string({ message: 'La fecha de inicio debe ser texto' })
      .regex(ISO_DATE_REGEX, 'Formato de fecha inválido (use YYYY-MM-DD)')
      .optional(),

    /** Coverage period end date (ISO 8601 date string) */
    endDate: z
      .string({ message: 'La fecha de fin debe ser texto' })
      .regex(ISO_DATE_REGEX, 'Formato de fecha inválido (use YYYY-MM-DD)')
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
 * Should match PolicyUpdateRequest from types
 */
export type PolicyEditFormData = z.infer<typeof policyUpdateSchema>
