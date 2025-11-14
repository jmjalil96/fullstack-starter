/**
 * Validation schema for affiliate detail view
 */

import { z } from 'zod'

/**
 * Path parameter validation for GET /api/affiliates/:id
 * Validates that :id is a valid CUID format
 */
export const affiliateIdParamSchema = z.object({
  id: z.string().cuid('ID de afiliado inválido'),
})

/**
 * Inferred TypeScript type from param schema
 */
export type AffiliateIdParam = z.infer<typeof affiliateIdParamSchema>
