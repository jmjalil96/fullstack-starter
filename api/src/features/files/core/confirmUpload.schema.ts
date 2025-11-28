/**
 * confirmUpload.schema.ts
 * Zod validation for confirming file uploads
 */

import { z } from 'zod'

/**
 * Schema for confirming a file upload
 */
export const confirmUploadSchema = z.object({
  storageKey: z
    .string({ message: 'La clave de almacenamiento es requerida' })
    .min(1, 'La clave de almacenamiento es requerida'),

  originalName: z
    .string({ message: 'El nombre del archivo es requerido' })
    .min(1, 'El nombre del archivo es requerido')
    .max(255, 'El nombre del archivo no puede exceder 255 caracteres'),

  fileSize: z
    .number({ message: 'El tamaño del archivo es requerido' })
    .int('El tamaño debe ser un número entero')
    .positive('El tamaño debe ser mayor a 0'),

  mimeType: z
    .string({ message: 'El tipo de archivo es requerido' })
    .min(1, 'El tipo de archivo es requerido'),

  entityType: z.enum(['CLAIM', 'INVOICE', 'TICKET', 'DOCUMENT'], {
    message: 'Tipo de entidad inválido',
  }),

  entityId: z
    .string({ message: 'El ID de la entidad es requerido' })
    .cuid('ID de entidad inválido'),

  // Optional entity-specific metadata
  category: z
    .string()
    .max(50, 'La categoría no puede exceder 50 caracteres')
    .optional(),

  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
})

export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>
