/**
 * Validation schemas for new claim endpoint
 */

import { z } from 'zod'

/**
 * Request body validation schema
 */
export const createClaimSchema = z.object({
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
 * Query parameter validation for available-affiliates endpoint
 */
export const availableAffiliatesQuerySchema = z.object({
  clientId: z
    .string({ message: 'clientId es requerido' })
    .cuid('Formato de clientId inválido'),
})

/**
 * Query parameter validation for available-patients endpoint
 */
export const availablePatientsQuerySchema = z.object({
  affiliateId: z
    .string({ message: 'affiliateId es requerido' })
    .cuid('Formato de affiliateId inválido'),
})

// Infer TypeScript type from schema
export type CreateClaimInput = z.infer<typeof createClaimSchema>
export type AvailableAffiliatesQuery = z.infer<typeof availableAffiliatesQuerySchema>
export type AvailablePatientsQuery = z.infer<typeof availablePatientsQuerySchema>
