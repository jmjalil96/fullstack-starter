/**
 * Validation schema for viewing/listing policies
 */

import { z } from 'zod'

/**
 * Query parameter validation for GET /api/policies
 *
 * All filters are optional except page/limit (which have defaults).
 * Unknown query parameters are stripped (ignored).
 * Authorization happens in service layer.
 *
 * Defaults:
 * - page: 1
 * - limit: 20
 *
 * Note: search is normalized to uppercase for case-insensitive policyNumber matching
 */
export const getPoliciesQuerySchema = z
  .object({
    /** Filter by policy status */
    status: z
      .enum(['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED'], {
        message: 'Estado inválido',
      })
      .optional(),

    /** Filter by client ID */
    clientId: z.string().cuid('ID de cliente inválido').optional(),

    /** Filter by insurer ID */
    insurerId: z.string().cuid('ID de aseguradora inválido').optional(),

    /** Search by policy number (case-insensitive, exact match) */
    search: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, 'Búsqueda debe tener al menos 3 caracteres')
      .max(50, 'Búsqueda no puede exceder 50 caracteres')
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
  .strip() // Ignore unknown query parameters

/**
 * Inferred TypeScript type from schema
 */
export type GetPoliciesQuery = z.infer<typeof getPoliciesQuerySchema>
