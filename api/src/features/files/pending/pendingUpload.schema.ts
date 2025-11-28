/**
 * pendingUpload.schema.ts
 * Validation schema for pending file upload requests
 */

import { z } from 'zod'

export const pendingUploadSchema = z.object({
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

  intendedEntityType: z.enum(['CLAIM', 'TICKET'], {
    message: 'Tipo de entidad inválido',
  }),
})

export type PendingUploadInput = z.infer<typeof pendingUploadSchema>
