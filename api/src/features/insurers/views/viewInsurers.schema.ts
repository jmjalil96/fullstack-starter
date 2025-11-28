/**
 * Validation schema for viewing/listing insurers
 */

import { z } from 'zod'

/**
 * Query parameter validation for GET /api/insurers
 *
 * All filters are optional except page/limit (which have defaults).
 * Unknown query parameters are stripped (ignored).
 * Authorization happens in service layer.
 *
 * Defaults:
 * - page: 1
 * - limit: 10
 */
export const getInsurersQuerySchema = z
  .object({
    /** Search by name or code (case-insensitive, contains match) */
    search: z
      .string()
      .trim()
      .min(1, 'Búsqueda debe tener al menos 1 caracter')
      .max(100, 'Búsqueda no puede exceder 100 caracteres')
      .optional(),

    /** Filter by active status */
    isActive: z
      .enum(['true', 'false'], {
        message: 'El estado activo debe ser true o false',
      })
      .transform((val) => val === 'true')
      .optional(),

    /** Page number (validated >= 1, default: 1) */
    page: z.coerce.number().int().min(1, 'Página debe ser mayor o igual a 1').default(1),

    /** Items per page (validated 1-100, default: 10) */
    limit: z
      .coerce
      .number()
      .int()
      .min(1, 'Límite debe estar entre 1 y 100')
      .max(100, 'Límite debe estar entre 1 y 100')
      .default(10),
  })
  .strip() // Ignore unknown query parameters

/**
 * Inferred TypeScript type from schema
 */
export type GetInsurersQuery = z.infer<typeof getInsurersQuerySchema>
