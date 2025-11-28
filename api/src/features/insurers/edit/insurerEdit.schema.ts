/**
 * Validation schema for insurer editing endpoint (PUT /api/insurers/:id)
 *
 * Validates partial updates to insurers with:
 * - Type checking (string, boolean)
 * - Format validation (email format, URL format)
 * - Value constraints (min/max lengths)
 * - Spanish error messages
 * - At least one field required (empty updates rejected)
 *
 * Simple entity - no lifecycle/status validation needed.
 * Uniqueness validation (name, code) happens in service layer.
 */

import { z } from 'zod'

/**
 * Path parameter validation for PUT /api/insurers/:id
 */
export const insurerIdParamSchema = z.object({
  id: z.string().cuid('ID de aseguradora inválido'),
})

/**
 * Body validation schema for insurer updates
 *
 * All fields optional (partial update pattern).
 * Unknown fields are stripped (ignored).
 * At least one field must be provided (empty updates rejected).
 *
 * Nullable fields:
 * - code, email, phone, website can be set to null to clear the value
 * - name, isActive cannot be null (required in database)
 */
export const updateInsurerSchema = z
  .object({
    /** Insurer name (2-100 chars, must be unique if provided) */
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .optional(),

    /** Short code (2-20 chars, must be unique if provided, can be null to clear) */
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(2, 'El código debe tener al menos 2 caracteres')
      .max(20, 'El código no puede exceder 20 caracteres')
      .nullable()
      .optional(),

    /** Contact email (valid format, can be null to clear) */
    email: z
      .string()
      .trim()
      .email('Formato de correo electrónico inválido')
      .max(255, 'El correo no puede exceder 255 caracteres')
      .nullable()
      .optional(),

    /** Contact phone (7-20 chars, can be null to clear) */
    phone: z
      .string()
      .trim()
      .min(7, 'El teléfono debe tener al menos 7 caracteres')
      .max(20, 'El teléfono no puede exceder 20 caracteres')
      .nullable()
      .optional(),

    /** Website URL (valid format, can be null to clear) */
    website: z
      .string()
      .trim()
      .url('Formato de URL inválido')
      .max(255, 'El sitio web no puede exceder 255 caracteres')
      .nullable()
      .optional(),

    /** Day of month for billing cutoff (1-28) */
    billingCutoffDay: z
      .number({ message: 'El día de corte debe ser un número' })
      .int('El día de corte debe ser un número entero')
      .min(1, 'El día de corte debe ser entre 1 y 28')
      .max(28, 'El día de corte debe ser entre 1 y 28')
      .optional(),

    /** Whether insurer is active */
    isActive: z
      .boolean({ message: 'El estado activo debe ser verdadero o falso' })
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
 * Input type (before Zod parsing)
 */
export type UpdateInsurerInput = z.input<typeof updateInsurerSchema>

/**
 * Output type (after Zod parsing/transformation)
 */
export type UpdateInsurerParsed = z.output<typeof updateInsurerSchema>

/**
 * Path parameter type
 */
export type InsurerIdParam = z.infer<typeof insurerIdParamSchema>
