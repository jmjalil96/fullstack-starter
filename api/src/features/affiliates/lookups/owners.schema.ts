/**
 * Validation schema for available owners endpoint
 */

import { z } from 'zod'

/**
 * Query parameter validation for GET /api/affiliates/available-owners
 *
 * Requires clientId to filter owners by client.
 * Unknown query parameters are stripped (ignored).
 */
export const getAvailableOwnersSchema = z
  .object({
    /** Client ID to filter owners (required) */
    clientId: z.string().cuid('ID de cliente inválido'),
  })
  .strip() // Ignore unknown query parameters

/**
 * Inferred TypeScript type from schema
 */
export type GetAvailableOwnersQuery = z.infer<typeof getAvailableOwnersSchema>
