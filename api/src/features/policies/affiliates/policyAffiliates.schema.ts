/**
 * Validation schema for viewing affiliates covered under a policy
 */

import { z } from 'zod'

/**
 * Path parameter validation for GET /api/policies/:policyId/affiliates
 *
 * Validates that :policyId is a valid CUID format
 */
export const policyIdParamSchema = z.object({
  policyId: z.string().cuid('ID de póliza inválido'),
})

/**
 * Inferred TypeScript type from path param schema
 */
export type PolicyIdParam = z.infer<typeof policyIdParamSchema>

/**
 * Query parameter validation for GET /api/policies/:policyId/affiliates
 *
 * All filters are optional except page/limit (which have defaults).
 * Unknown query parameters are stripped (ignored).
 * Authorization and scope filtering happen in service layer.
 *
 * Defaults:
 * - page: 1
 * - limit: 20
 *
 * Note: search is case-insensitive partial match across firstName, lastName, documentNumber
 */
export const getPolicyAffiliatesQuerySchema = z
  .object({
    /** Search by first name, last name, or document number (case-insensitive, partial match) */
    search: z
      .string()
      .trim()
      .min(2, 'Búsqueda debe tener al menos 2 caracteres')
      .max(100, 'Búsqueda no puede exceder 100 caracteres')
      .optional(),

    /** Filter by affiliate type */
    affiliateType: z
      .enum(['OWNER', 'DEPENDENT'], {
        message: 'Tipo de afiliado inválido',
      })
      .optional(),

    /** Filter by active status (string enum converted to boolean) */
    isActive: z
      .enum(['true', 'false'], {
        message: 'Estado activo debe ser "true" o "false"',
      })
      .optional()
      .transform((val) => {
        if (val === 'true') return true
        if (val === 'false') return false
        return undefined
      }),

    /** Page number (validated >= 1, default: 1) */
    page: z.coerce.number().int().min(1, 'Página debe ser mayor o igual a 1').default(1),

    /** Items per page (validated 1-100, default: 20) */
    limit: z
      .coerce
      .number()
      .int()
      .min(1, 'Límite debe estar entre 1 y 100')
      .max(100, 'Límite debe estar entre 1 y 100')
      .default(20),
  })
  .strip() // Ignore unknown query parameters

/**
 * Inferred TypeScript type from query schema
 */
export type GetPolicyAffiliatesQuery = z.infer<typeof getPolicyAffiliatesQuerySchema>
