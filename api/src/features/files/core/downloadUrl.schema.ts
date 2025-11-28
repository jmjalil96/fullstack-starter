/**
 * downloadUrl.schema.ts
 * Zod validation for download URL requests
 */

import { z } from 'zod'

/**
 * Schema for file ID in route params
 */
export const downloadUrlParamsSchema = z.object({
  id: z
    .string({ message: 'El ID del archivo es requerido' })
    .cuid('ID de archivo inválido'),
})

export type DownloadUrlParams = z.infer<typeof downloadUrlParamsSchema>
