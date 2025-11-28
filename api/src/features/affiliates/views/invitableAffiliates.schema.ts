/**
 * Validation schema for invitable affiliates lookup
 */

import { z } from 'zod'

/**
 * Query parameter validation for GET /api/affiliates/invitable
 *
 * Defaults:
 * - page: 1
 * - limit: 20
 */
export const getInvitableAffiliatesQuerySchema = z
  .object({
    /** Filter by client ID */
    clientId: z.string().cuid('ID de cliente inválido').optional(),

    /** Search by name, email, or document number */
    search: z
      .string()
      .trim()
      .min(2, 'Búsqueda debe tener al menos 2 caracteres')
      .max(100, 'Búsqueda no puede exceder 100 caracteres')
      .optional(),

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
  .strip()

/**
 * Inferred TypeScript type from schema
 */
export type GetInvitableAffiliatesQuery = z.infer<typeof getInvitableAffiliatesQuerySchema>
