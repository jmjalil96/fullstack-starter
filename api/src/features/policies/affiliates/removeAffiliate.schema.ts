/**
 * Validation schema for removing an affiliate from a policy
 */

import { z } from 'zod'

/**
 * Path parameter validation for PATCH /api/policies/:policyId/affiliates/:affiliateId
 *
 * Validates both policyId and affiliateId are valid CUID format
 */
export const policyAffiliateParamsSchema = z.object({
  policyId: z.string().cuid('ID de póliza inválido'),
  affiliateId: z.string().cuid('ID de afiliado inválido'),
})

/**
 * Inferred TypeScript type from path param schema
 */
export type PolicyAffiliateParams = z.infer<typeof policyAffiliateParamsSchema>

/**
 * Request body validation for PATCH /api/policies/:policyId/affiliates/:affiliateId
 *
 * Validates removal date format and constraints.
 * addedAt comparison happens in service layer (needs DB lookup).
 *
 * Unknown fields are rejected via .strict()
 */
export const removeAffiliateFromPolicySchema = z
  .object({
    /** Date when affiliate is removed from policy */
    removedAt: z.coerce
      .date({ message: 'Fecha de baja inválida' })
      .refine(
        (val) => val <= new Date(),
        { message: 'La fecha de baja no puede ser futura' }
      ),
  })
  .strict()

/**
 * Inferred TypeScript type from the Zod schema
 * Use this type in the service layer after validation
 */
export type RemoveAffiliateFromPolicyInput = z.infer<typeof removeAffiliateFromPolicySchema>
