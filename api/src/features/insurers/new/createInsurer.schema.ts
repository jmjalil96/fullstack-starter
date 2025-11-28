/**
 * Validation schema for creating insurers (POST /api/insurers)
 */

import { z } from 'zod'

/**
 * Body validation schema for creating insurers
 *
 * Validation rules:
 * - name: required, 2-100 chars, trimmed
 * - code: optional, 2-20 chars, trimmed and uppercased
 * - email: optional, valid email format, max 255 chars
 * - phone: optional, 7-20 chars
 * - website: optional, valid URL format, max 255 chars
 *
 * Unknown fields are stripped (ignored).
 * Uniqueness validation (name, code) happens in service layer.
 */
export const createInsurerSchema = z
  .object({
    /** Insurer name (required, unique at DB level) */
    name: z
      .string({ message: 'El nombre es requerido' })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),

    /** Short code (optional, unique at DB level, will be uppercased) */
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(2, 'El código debe tener al menos 2 caracteres')
      .max(20, 'El código no puede exceder 20 caracteres')
      .optional(),

    /** Contact email (optional) */
    email: z
      .string()
      .trim()
      .email('Formato de correo electrónico inválido')
      .max(255, 'El correo no puede exceder 255 caracteres')
      .optional(),

    /** Contact phone (optional) */
    phone: z
      .string()
      .trim()
      .min(7, 'El teléfono debe tener al menos 7 caracteres')
      .max(20, 'El teléfono no puede exceder 20 caracteres')
      .optional(),

    /** Website URL (optional) */
    website: z
      .string()
      .trim()
      .url('Formato de URL inválido')
      .max(255, 'El sitio web no puede exceder 255 caracteres')
      .optional(),

    /** Day of month for billing cutoff (optional, defaults to 25) */
    billingCutoffDay: z
      .number({ message: 'El día de corte debe ser un número' })
      .int('El día de corte debe ser un número entero')
      .min(1, 'El día de corte debe ser entre 1 y 28')
      .max(28, 'El día de corte debe ser entre 1 y 28')
      .optional(),
  })
  .strip() // Ignore unknown fields

/**
 * Input type (before Zod parsing)
 */
export type CreateInsurerInput = z.input<typeof createInsurerSchema>

/**
 * Output type (after Zod parsing/transformation)
 */
export type CreateInsurerParsed = z.output<typeof createInsurerSchema>
