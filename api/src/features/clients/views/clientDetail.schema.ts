/**
 * Validation schema for client detail view
 */

import { z } from 'zod'

/**
 * Path parameter validation for GET /api/clients/:id
 */
export const clientIdParamSchema = z.object({
  id: z.string().cuid('ID de cliente inválido'),
})

/**
 * Inferred TypeScript type from param schema
 */
export type ClientIdParam = z.infer<typeof clientIdParamSchema>
