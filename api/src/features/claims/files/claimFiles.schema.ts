/**
 * claimFiles.schema.ts
 * Zod validation for claim files requests
 */

import { z } from 'zod'

/**
 * Schema for claim ID in route params
 */
export const claimFilesParamsSchema = z.object({
  claimId: z
    .string({ message: 'El ID del reclamo es requerido' })
    .cuid('ID de reclamo inválido'),
})

export type ClaimFilesParams = z.infer<typeof claimFilesParamsSchema>
