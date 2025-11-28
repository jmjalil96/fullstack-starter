/**
 * Validation schema for viewing/listing employees
 */

import { z } from 'zod'

/**
 * Query parameter validation for GET /api/employees
 */
export const getEmployeesQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .min(2, 'Búsqueda debe tener al menos 2 caracteres')
      .max(100, 'Búsqueda no puede exceder 100 caracteres')
      .optional(),

    department: z.string().trim().max(100).optional(),

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

    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strip()

export type GetEmployeesQuery = z.infer<typeof getEmployeesQuerySchema>
