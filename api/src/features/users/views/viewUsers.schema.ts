/**
 * Validation schema for viewing/listing users
 */

import { z } from 'zod'

/**
 * Query parameter validation for GET /api/users
 *
 * Defaults:
 * - page: 1
 * - limit: 20
 */
export const getUsersQuerySchema = z
  .object({
    /** Search by email or name */
    search: z
      .string()
      .trim()
      .min(2, 'Búsqueda debe tener al menos 2 caracteres')
      .max(100, 'Búsqueda no puede exceder 100 caracteres')
      .optional(),

    /** Filter by user type */
    type: z
      .enum(['EMPLOYEE', 'AGENT', 'AFFILIATE', 'SYSTEM'], {
        message: 'Tipo de usuario inválido',
      })
      .optional(),

    /** Filter by role ID */
    roleId: z.string().cuid('ID de rol inválido').optional(),

    /** Filter by active status */
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

    /** Page number */
    page: z.coerce.number().int().min(1, 'Página debe ser mayor o igual a 1').default(1),

    /** Items per page */
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
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>
