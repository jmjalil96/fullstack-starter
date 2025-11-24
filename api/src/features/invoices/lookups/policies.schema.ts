/**
 * Validation schema for available policies endpoint
 */

import { z } from 'zod'

/**
 * Query parameter validation for GET /api/invoices/available-policies
 *
 * Requires clientId and insurerId to filter policies.
 * Unknown query parameters are stripped (ignored).
 */
export const getAvailablePoliciesSchema = z
  .object({
    /** Client ID to filter policies (required) */
    clientId: z.string().cuid('ID de cliente inválido'),

    /** Insurer ID to filter policies (required) */
    insurerId: z.string().cuid('ID de aseguradora inválido'),
  })
  .strip() // Ignore unknown query parameters

/**
 * Inferred TypeScript type from schema
 */
export type GetAvailablePoliciesQuery = z.infer<typeof getAvailablePoliciesSchema>
