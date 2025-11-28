/**
 * Validation schema for insurer creation
 *
 * Mirrors backend validation from: api/src/features/insurers/new/createInsurer.schema.ts
 *
 * Used by:
 * - CreateInsurerModal form validation (react-hook-form)
 */

import { z } from 'zod'

/**
 * Insurer create validation schema
 *
 * Required fields:
 * - name: required, 2-100 chars
 *
 * Optional fields:
 * - code: 2-20 chars (will be uppercased by backend)
 * - email: valid email format
 * - phone: 7-20 chars
 * - website: valid URL format
 */
export const createInsurerSchema = z
  .object({
    /** Insurer name (required) */
    name: z
      .string({ message: 'El nombre es requerido' })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),

    /** Short code (optional, will be uppercased by backend) */
    code: z
      .string()
      .trim()
      .min(2, 'El código debe tener al menos 2 caracteres')
      .max(20, 'El código no puede exceder 20 caracteres')
      .or(z.literal(''))
      .optional(),

    /** Contact email (optional) */
    email: z
      .string()
      .trim()
      .email('Formato de correo electrónico inválido')
      .max(255, 'El correo no puede exceder 255 caracteres')
      .or(z.literal(''))
      .optional(),

    /** Contact phone (optional) */
    phone: z
      .string()
      .trim()
      .min(7, 'El teléfono debe tener al menos 7 caracteres')
      .max(20, 'El teléfono no puede exceder 20 caracteres')
      .or(z.literal(''))
      .optional(),

    /** Website URL (optional) */
    website: z
      .string()
      .trim()
      .url('Formato de URL inválido')
      .max(255, 'El sitio web no puede exceder 255 caracteres')
      .or(z.literal(''))
      .optional(),
  })
  .strip()

/**
 * Inferred type from schema
 */
export type InsurerCreateFormData = z.infer<typeof createInsurerSchema>
