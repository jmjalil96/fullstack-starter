/**
 * Validation schema for creating policies
 */

import { z } from 'zod'

/**
 * Request body validation for POST /api/policies
 *
 * Policy number must be unique (enforced at database level).
 * Dates must be valid ISO 8601 format and endDate > startDate.
 * Unknown fields are stripped.
 */
export const createPolicySchema = z
  .object({
    /** Policy number (unique identifier, uppercased) */
    policyNumber: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, 'El número de póliza debe tener al menos 3 caracteres')
      .max(50, 'El número de póliza no puede exceder 50 caracteres'),

    /** Client ID (company this policy is for) */
    clientId: z
      .string({ message: 'El cliente es requerido' })
      .cuid('ID de cliente inválido'),

    /** Insurer ID (insurance carrier) */
    insurerId: z
      .string({ message: 'La aseguradora es requerida' })
      .cuid('ID de aseguradora inválido'),

    /** Policy type/category (optional) */
    type: z
      .string()
      .trim()
      .min(1)
      .max(100, 'El tipo no puede exceder 100 caracteres')
      .optional(),

    /** Coverage period start date (ISO 8601) */
    startDate: z
      .coerce
      .date({ message: 'Fecha de inicio inválida (use formato ISO 8601)' }),

    /** Coverage period end date (ISO 8601) */
    endDate: z
      .coerce
      .date({ message: 'Fecha de fin inválida (use formato ISO 8601)' }),
  })
  .strip()
  .refine(
    (data) => data.endDate > data.startDate,
    {
      message: 'La fecha de fin debe ser posterior a la fecha de inicio',
      path: ['endDate'],
    }
  )

/**
 * Inferred TypeScript type from schema
 */
export type CreatePolicyInput = z.infer<typeof createPolicySchema>
