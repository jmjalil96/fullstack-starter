/**
 * uploadUrl.schema.ts
 * Zod validation for upload URL requests
 */

import { z } from 'zod'

/**
 * Schema for requesting a presigned upload URL
 */
export const uploadUrlSchema = z.object({
  fileName: z
    .string({ message: 'El nombre del archivo es requerido' })
    .min(1, 'El nombre del archivo es requerido')
    .max(255, 'El nombre del archivo no puede exceder 255 caracteres'),

  mimeType: z
    .string({ message: 'El tipo de archivo es requerido' })
    .min(1, 'El tipo de archivo es requerido'),

  fileSize: z
    .number({ message: 'El tamaño del archivo es requerido' })
    .int('El tamaño debe ser un número entero')
    .positive('El tamaño debe ser mayor a 0')
    .max(50 * 1024 * 1024, 'El archivo no puede exceder 50MB'),

  entityType: z.enum(['CLAIM', 'INVOICE', 'TICKET', 'DOCUMENT'], {
    message: 'Tipo de entidad inválido',
  }),

  entityId: z
    .string({ message: 'El ID de la entidad es requerido' })
    .cuid('ID de entidad inválido'),
})

export type UploadUrlInput = z.infer<typeof uploadUrlSchema>
