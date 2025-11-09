/**
 * Validation schema for creating clients
 */

import { z } from 'zod'

/**
 * Request body validation for POST /api/clients
 *
 * All fields are trimmed.
 * taxId must be unique (enforced at database level).
 * Unknown fields are stripped.
 */
export const createClientSchema = z
  .object({
    /** Client company name (2-200 chars) */
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(200, 'El nombre no puede exceder 200 caracteres'),

    /** Tax identification number (8-20 chars, unique) */
    taxId: z
      .string()
      .trim()
      .min(8, 'El RUC/Tax ID debe tener al menos 8 caracteres')
      .max(20, 'El RUC/Tax ID no puede exceder 20 caracteres')
      .regex(/^\d{8,20}$/, 'El RUC/Tax ID debe contener solo dígitos (8-20)'),

    /** Primary contact email (optional, valid format) */
    email: z
      .string()
      .trim()
      .email('Formato de correo electrónico inválido')
      .max(255)
      .optional(),

    /** Primary contact phone (optional) */
    phone: z
      .string()
      .trim()
      .min(7, 'El teléfono debe tener al menos 7 caracteres')
      .max(20, 'El teléfono no puede exceder 20 caracteres')
      .optional(),

    /** Business address (optional) */
    address: z
      .string()
      .trim()
      .max(500, 'La dirección no puede exceder 500 caracteres')
      .optional(),
  })
  .strip()

/**
 * Inferred TypeScript type from schema
 */
export type CreateClientInput = z.infer<typeof createClientSchema>
