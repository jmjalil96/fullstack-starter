/**
 * Validation schema for viewing/listing affiliates
 */

import { z } from 'zod'

/**
 * Query parameter validation for GET /api/affiliates
 *
 * All filters are optional except page/limit (which have defaults).
 * Unknown query parameters are stripped (ignored).
 * Authorization and scope filtering happen in service layer.
 *
 * Defaults:
 * - page: 1
 * - limit: 20
 *
 * Note: search is case-insensitive partial match across firstName, lastName, documentNumber, client.name
 */
export const getAffiliatesQuerySchema = z
  .object({
    /** Filter by client ID */
    clientId: z.string().cuid('ID de cliente inválido').optional(),

    /** Search by first name, last name, document number, or client name (case-insensitive, partial match) */
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

    /** Filter by coverage type */
    coverageType: z
      .enum(['T', 'TPLUS1', 'TPLUSF'], {
        message: 'Tipo de cobertura inválido',
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
 * Inferred TypeScript type from schema
 */
export type GetAffiliatesQuery = z.infer<typeof getAffiliatesQuerySchema>
