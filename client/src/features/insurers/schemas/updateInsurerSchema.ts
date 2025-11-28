/**
 * Validation schema for insurer editing
 *
 * Mirrors backend validation from: api/src/features/insurers/edit/insurerEdit.schema.ts
 *
 * Used by:
 * - EditInsurerModal form validation (react-hook-form)
 */

import { z } from 'zod'

/**
 * Insurer update validation schema
 *
 * All fields optional (partial update pattern).
 * Null values allowed for nullable fields (code, email, phone, website).
 * At least one field must be provided (empty updates rejected).
 */
export const updateInsurerSchema = z
  .object({
    /** Insurer name (2-100 chars) */
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .optional(),

    /** Short code (2-20 chars, can be null to clear) */
    code: z
      .string()
      .trim()
      .min(2, 'El código debe tener al menos 2 caracteres')
      .max(20, 'El código no puede exceder 20 caracteres')
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Contact email (valid format, can be null to clear) */
    email: z
      .string()
      .trim()
      .email('Formato de correo electrónico inválido')
      .max(255, 'El correo no puede exceder 255 caracteres')
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Contact phone (7-20 chars, can be null to clear) */
    phone: z
      .string()
      .trim()
      .min(7, 'El teléfono debe tener al menos 7 caracteres')
      .max(20, 'El teléfono no puede exceder 20 caracteres')
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Website URL (valid format, can be null to clear) */
    website: z
      .string()
      .trim()
      .url('Formato de URL inválido')
      .max(255, 'El sitio web no puede exceder 255 caracteres')
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Whether insurer is active */
    isActive: z
      .boolean({ message: 'El estado activo debe ser verdadero o falso' })
      .optional(),
  })
  .strip()
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
 * Inferred type from schema
 */
export type InsurerUpdateFormData = z.infer<typeof updateInsurerSchema>
