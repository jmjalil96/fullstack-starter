/**
 * Validation schema for insurer detail endpoint (GET /api/insurers/:id)
 */

import { z } from 'zod'

/**
 * Path parameter validation for GET /api/insurers/:id
 *
 * Validates the insurer ID is a valid CUID format.
 */
export const insurerIdParamSchema = z.object({
  id: z.string().cuid('ID de aseguradora inválido'),
})

/**
 * Inferred TypeScript type from schema
 */
export type InsurerIdParam = z.infer<typeof insurerIdParamSchema>
