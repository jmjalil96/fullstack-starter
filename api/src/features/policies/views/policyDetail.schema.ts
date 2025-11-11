/**
 * Validation schema for policy detail view
 */

import { z } from 'zod'

/**
 * Path parameter validation for GET /api/policies/:id
 */
export const policyIdParamSchema = z.object({
  id: z.string().cuid('ID de póliza inválido'),
})

/**
 * Inferred TypeScript type from param schema
 */
export type PolicyIdParam = z.infer<typeof policyIdParamSchema>
