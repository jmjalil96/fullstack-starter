/**
 * Validation schema for claim detail endpoint (GET /api/claims/:id)
 */

import { z } from 'zod'

/**
 * URL parameter validation for claim ID
 * Validates that :id is a valid CUID format
 */
export const claimIdParamSchema = z.object({
  id: z.string().cuid('ID de reclamo inválido'),
})

/**
 * Inferred TypeScript type from schema
 */
export type ClaimIdParam = z.infer<typeof claimIdParamSchema>
