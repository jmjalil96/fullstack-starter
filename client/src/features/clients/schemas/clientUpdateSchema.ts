/**
 * Validation schema for client editing
 *
 * Mirrors backend validation from: api/src/features/clients/edit/clientEdit.schema.ts
 *
 * Used by:
 * - EditClientModal form validation (react-hook-form)
 */

import { z } from 'zod'

/**
 * Client update validation schema
 *
 * All fields optional (partial update pattern).
 * Null values allowed for nullable fields (email, phone, address).
 * At least one field must be provided (empty updates rejected).
 */
export const clientUpdateSchema = z
  .object({
    /** Client company name (2-200 chars) */
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(200, 'El nombre no puede exceder 200 caracteres')
      .optional(),

    /** Tax identification number (8-20 digits, unique) */
    taxId: z
      .string()
      .trim()
      .min(8, 'El RUC/Tax ID debe tener al menos 8 caracteres')
      .max(20, 'El RUC/Tax ID no puede exceder 20 caracteres')
      .regex(/^\d{8,20}$/, 'El RUC/Tax ID debe contener solo dígitos (8-20)')
      .optional(),

    /** Primary contact email (valid format, can be null to clear) */
    email: z
      .string()
      .trim()
      .email('Formato de correo electrónico inválido')
      .max(255)
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Primary contact phone (7-20 chars, can be null to clear) */
    phone: z
      .string()
      .trim()
      .min(7, 'El teléfono debe tener al menos 7 caracteres')
      .max(20, 'El teléfono no puede exceder 20 caracteres')
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Business address (max 500 chars, can be null to clear) */
    address: z
      .string()
      .trim()
      .max(500, 'La dirección no puede exceder 500 caracteres')
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Whether client is active */
    isActive: z
      .boolean({ message: 'El estado activo debe ser verdadero o falso' })
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
 * Should match ClientUpdateRequest from types
 */
export type ClientUpdateFormData = z.infer<typeof clientUpdateSchema>
