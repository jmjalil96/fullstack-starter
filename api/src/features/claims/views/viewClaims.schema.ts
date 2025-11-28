/**
 * Validation schema for viewing/listing claims
 */

import { z } from 'zod'

/**
 * Claim status enum for validation
 */
export const CLAIM_STATUS_ENUM = [
  'DRAFT',
  'PENDING_INFO',
  'VALIDATION',
  'SUBMITTED',
  'RETURNED',
  'SETTLED',
  'CANCELLED',
] as const

/**
 * Query parameter validation for GET /api/claims
 *
 * All filters are optional except page/limit (which have defaults).
 * Unknown query parameters are stripped (ignored).
 * Authorization and scope filtering happen in service layer.
 *
 * Defaults:
 * - page: 1
 * - limit: 20
 */
export const getClaimsQuerySchema = z
  .object({
    /** Filter by claim status */
    status: z
      .enum(CLAIM_STATUS_ENUM, {
        message: 'Estado inválido',
      })
      .optional(),

    /** Filter by client ID (for broker employees) */
    clientId: z.string().cuid('ID de cliente inválido').optional(),

    /** Search by claim number, affiliate name, or patient name (partial match, case-insensitive) */
    search: z.string().trim().max(100).optional(),

    /** Date field to filter on */
    dateField: z
      .enum(['submittedDate', 'createdAt', 'incidentDate', 'settlementDate'], {
        message: 'Campo de fecha inválido',
      })
      .optional(),

    /** Start date for range filter (ISO format: YYYY-MM-DD) */
    dateFrom: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
      .optional(),

    /** End date for range filter (ISO format: YYYY-MM-DD) */
    dateTo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
      .optional(),

    /** Page number (validated >= 1, default: 1) */
    page: z.coerce.number().int().min(1, 'Página debe ser mayor o igual a 1').default(1),

    /** Items per page (validated 1-100, default: 20) */
    limit: z
      .coerce.number()
      .int()
      .min(1, 'Límite debe estar entre 1 y 100')
      .max(100, 'Límite debe estar entre 1 y 100')
      .default(20),
  })
  .strip() // Ignore unknown query parameters

/**
 * Inferred TypeScript type from schema
 */
export type GetClaimsQuery = z.infer<typeof getClaimsQuerySchema>
