/**
 * Validation schema for client editing endpoint (PUT /api/clients/:id)
 *
 * Validates partial updates to clients with:
 * - Type checking (string, boolean)
 * - Format validation (taxId digits-only, email format)
 * - Value constraints (min/max lengths)
 * - Spanish error messages
 *
 * Much simpler than claims - no lifecycle/status validation needed.
 */

import { z } from 'zod'

/**
 * Body validation schema for client updates
 *
 * All fields optional (partial update pattern).
 * Unknown fields are stripped (ignored).
 * At least one field must be provided (empty updates rejected).
 *
 * Nullable fields:
 * - email, phone, address can be set to null to clear the value
 * - name, taxId, isActive cannot be null (required in database)
 */
export const updateClientSchema = z
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

    /** Primary contact email (optional, valid format, can be null to clear) */
    email: z
      .string()
      .trim()
      .email('Formato de correo electrónico inválido')
      .max(255)
      .nullable()
      .optional(),

    /** Primary contact phone (can be null to clear) */
    phone: z
      .string()
      .trim()
      .min(7, 'El teléfono debe tener al menos 7 caracteres')
      .max(20, 'El teléfono no puede exceder 20 caracteres')
      .nullable()
      .optional(),

    /** Business address (can be null to clear) */
    address: z
      .string()
      .trim()
      .max(500, 'La dirección no puede exceder 500 caracteres')
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
    const hasAnyValue = Object.values(data).some((v) => v !== undefined)
    if (!hasAnyValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe proporcionar al menos un campo para actualizar',
      })
    }
  })

/**
 * Inferred TypeScript type from schema
 */
export type UpdateClientInput = z.infer<typeof updateClientSchema>
