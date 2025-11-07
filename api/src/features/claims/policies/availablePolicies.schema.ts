/**
 * Validation schema for available policies endpoint
 */

import { z } from 'zod'

/**
 * Path parameter validation for GET /api/claims/:claimId/available-policies
 * Validates that :claimId is a valid CUID format
 */
export const availablePoliciesParamSchema = z.object({
  claimId: z.string().cuid('ID de reclamo inválido'),
})

/**
 * Inferred TypeScript type from schema
 */
export type AvailablePoliciesParam = z.infer<typeof availablePoliciesParamSchema>
