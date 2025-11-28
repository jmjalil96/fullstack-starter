/**
 * Validation schema for viewing/listing tickets
 */

import { z } from 'zod'

/**
 * Query parameter validation for GET /api/tickets
 *
 * All filters are optional except page/limit (which have defaults).
 * Unknown query parameters are stripped (ignored).
 * Authorization and scope filtering happen in service layer.
 *
 * Defaults:
 * - page: 1
 * - limit: 20
 *
 * Note: search is normalized to uppercase for case-insensitive ticketNumber matching
 */
export const getTicketsQuerySchema = z
  .object({
    /** Filter by ticket status */
    status: z
      .enum(['OPEN', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'RESOLVED', 'CLOSED'], {
        message: 'Estado inválido',
      })
      .optional(),

    /** Filter by ticket priority */
    priority: z
      .enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'], {
        message: 'Prioridad inválida',
      })
      .optional(),

    /** Filter by client ID */
    clientId: z.string().cuid('ID de cliente inválido').optional(),

    /** Filter by assigned employee ID */
    assignedToId: z.string().cuid('ID de asignado inválido').optional(),

    /** Filter by category */
    category: z
      .string()
      .trim()
      .max(100, 'La categoría no puede exceder 100 caracteres')
      .optional(),

    /** Search by ticket number (case-insensitive, exact match) */
    search: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, 'Búsqueda debe tener al menos 3 caracteres')
      .max(50)
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
export type GetTicketsQuery = z.infer<typeof getTicketsQuerySchema>
