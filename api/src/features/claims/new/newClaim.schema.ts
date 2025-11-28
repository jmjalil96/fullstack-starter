/**
 * Validation schemas for new claim endpoint
 */

import { z } from 'zod'

import { CARE_TYPE_ENUM } from '../edit/claimEdit.schema.js'

/**
 * Pending file schema - files uploaded before claim creation
 */
const pendingFileSchema = z.object({
  storageKey: z
    .string({ message: 'Storage key es requerido' })
    .min(1, 'Storage key es requerido'),

  originalName: z
    .string({ message: 'Nombre del archivo es requerido' })
    .min(1, 'Nombre del archivo es requerido'),

  fileSize: z
    .number({ message: 'Tamaño del archivo es requerido' })
    .positive('El tamaño debe ser mayor a 0'),

  mimeType: z
    .string({ message: 'Tipo de archivo es requerido' })
    .min(1, 'Tipo de archivo es requerido'),

  category: z
    .enum(['RECEIPT', 'PRESCRIPTION', 'LAB_REPORT', 'DISCHARGE_SUMMARY', 'AUTHORIZATION', 'OTHER'])
    .optional(),
})

/**
 * Request body validation schema
 */
export const createClaimSchema = z.object({
  clientId: z.string({ message: 'El cliente es requerido' }).cuid('ID de cliente inválido'),

  affiliateId: z
    .string({ message: 'El afiliado titular es requerido' })
    .cuid('ID de afiliado inválido'),

  patientId: z.string({ message: 'El paciente es requerido' }).cuid('ID de paciente inválido'),

  description: z
    .string({ message: 'La descripción debe ser texto' })
    .trim()
    .min(3, 'La descripción debe tener al menos 3 caracteres')
    .max(5000, 'La descripción no puede exceder 5000 caracteres')
    .optional(),

  careType: z.enum(CARE_TYPE_ENUM, { message: 'Tipo de atención inválido' }).optional(),

  diagnosisCode: z
    .string({ message: 'El código de diagnóstico debe ser texto' })
    .trim()
    .max(20, 'El código de diagnóstico no puede exceder 20 caracteres')
    .optional(),

  diagnosisDescription: z
    .string({ message: 'La descripción del diagnóstico debe ser texto' })
    .trim()
    .max(1000, 'La descripción del diagnóstico no puede exceder 1000 caracteres')
    .optional(),

  amountSubmitted: z
    .number({ message: 'El monto presentado debe ser un número' })
    .nonnegative('El monto presentado debe ser mayor o igual a 0')
    .optional(),

  incidentDate: z
    .coerce.date({ message: 'Fecha de incidente inválida (use formato ISO 8601)' })
    .optional(),

  submittedDate: z
    .coerce.date({ message: 'Fecha de presentación inválida (use formato ISO 8601)' })
    .optional(),

  // Pending files to attach to the claim
  pendingFiles: z.array(pendingFileSchema).optional().default([]),
})

// Infer TypeScript type from schema
export type CreateClaimInput = z.infer<typeof createClaimSchema>
