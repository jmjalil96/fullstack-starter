/**
 * Validation schema for new policy form
 * Mirrors backend validation: api/src/features/policies/new/createPolicy.schema.ts
 */

import { z } from 'zod'

/**
 * Policy form validation schema
 * Matches backend validation exactly for consistency
 *
 * Note: Dates are strings in the frontend (formatted by date picker)
 * and will be sent as ISO 8601 strings to the backend.
 */
export const policyFormSchema = z
  .object({
    /** Policy number (unique identifier, uppercased) */
    policyNumber: z
      .string({ message: 'El número de póliza es requerido' })
      .trim()
      .min(3, 'El número de póliza debe tener al menos 3 caracteres')
      .max(50, 'El número de póliza no puede exceder 50 caracteres')
      .transform((val) => val.toUpperCase()),

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

    /** Coverage period start date (formatted date string) */
    startDate: z
      .string({ message: 'La fecha de inicio es requerida' })
      .min(1, 'La fecha de inicio es requerida'),

    /** Coverage period end date (formatted date string) */
    endDate: z
      .string({ message: 'La fecha de fin es requerida' })
      .min(1, 'La fecha de fin es requerida'),
  })
  .refine(
    (data) => {
      // Convert string dates to Date objects for comparison
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      return end > start
    },
    {
      message: 'La fecha de fin debe ser posterior a la fecha de inicio',
      path: ['endDate'],
    }
  )

/**
 * TypeScript type inferred from schema
 * Use this for form data typing in react-hook-form
 */
export type PolicyFormData = z.infer<typeof policyFormSchema>
