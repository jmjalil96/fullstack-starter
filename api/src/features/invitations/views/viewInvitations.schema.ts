/**
 * Validation schema for viewing/listing invitations
 */

import { z } from 'zod'

/**
 * Query parameter validation for GET /api/invitations
 *
 * All filters are optional except page/limit (which have defaults).
 * Unknown query parameters are stripped (ignored).
 * Authorization and scope filtering happen in service layer.
 *
 * Defaults:
 * - status: PENDING
 * - page: 1
 * - limit: 20
 *
 * Note: search is case-insensitive partial match across email and entity name
 */
export const getInvitationsQuerySchema = z
  .object({
    /** Filter by invitation status (default: PENDING) */
    status: z
      .enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'], {
        message: 'Estado de invitación inválido',
      })
      .optional()
      .default('PENDING'),

    /** Filter by invitation type */
    type: z
      .enum(['EMPLOYEE', 'AGENT', 'AFFILIATE'], {
        message: 'Tipo de invitación inválido',
      })
      .optional(),

    /** Search by email or name (case-insensitive, partial match) */
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
  .strip() // Ignore unknown query parameters

/**
 * Inferred TypeScript type from schema
 */
export type GetInvitationsQuery = z.infer<typeof getInvitationsQuerySchema>
