/**
 * Client form validation schema
 * Mirrors backend: api/src/features/clients/new/createClient.schema.ts
 */

import { z } from 'zod'

/**
 * Zod schema for client creation form
 *
 * Mirrors backend validation exactly to provide instant client-side feedback.
 * Backend will re-validate for security.
 */
export const clientFormSchema = z.object({
  /** Client company name (2-200 chars) */
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres'),

  /** Tax identification number (8-20 digits, unique) */
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
    .optional()
    .or(z.literal('')), // Allow empty string (converted to undefined on submit)

  /** Primary contact phone (optional) */
  phone: z
    .string()
    .trim()
    .min(7, 'El teléfono debe tener al menos 7 caracteres')
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('')), // Allow empty string

  /** Business address (optional) */
  address: z
    .string()
    .trim()
    .max(500, 'La dirección no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')), // Allow empty string
})

/**
 * Inferred TypeScript type for form data
 */
export type ClientFormData = z.infer<typeof clientFormSchema>
