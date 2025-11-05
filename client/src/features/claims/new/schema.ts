/**
 * Validation schema for new claim form
 * Mirrors backend validation: api/src/features/claims/new/newClaim.schema.ts
 */

import { z } from 'zod'

/**
 * Claim form validation schema
 * Matches backend validation exactly for consistency
 */
export const claimFormSchema = z.object({
  clientId: z
    .string({ message: 'El cliente es requerido' })
    .cuid('ID de cliente inválido'),

  affiliateId: z
    .string({ message: 'El afiliado titular es requerido' })
    .cuid('ID de afiliado inválido'),

  patientId: z
    .string({ message: 'El paciente es requerido' })
    .cuid('ID de paciente inválido'),

  description: z
    .string({ message: 'La descripción es requerida' })
    .trim()
    .min(3, 'La descripción debe tener al menos 3 caracteres')
    .max(5000, 'La descripción no puede exceder 5000 caracteres'),
})

/**
 * TypeScript type inferred from schema
 * Use this for form data typing in react-hook-form
 */
export type ClaimFormData = z.infer<typeof claimFormSchema>
