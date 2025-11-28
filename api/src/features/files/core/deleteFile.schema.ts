/**
 * deleteFile.schema.ts
 * Zod validation for delete file requests
 */

import { z } from 'zod'

/**
 * Schema for file ID in route params
 */
export const deleteFileParamsSchema = z.object({
  id: z
    .string({ message: 'El ID del archivo es requerido' })
    .cuid('ID de archivo inválido'),
})

export type DeleteFileParams = z.infer<typeof deleteFileParamsSchema>
