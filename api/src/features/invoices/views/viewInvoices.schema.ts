/**
 * Validation schema for viewing/listing invoices
 */

import { z } from 'zod'

/**
 * Query parameter validation for GET /api/invoices
 *
 * All filters are optional. Pagination has defaults (page=1, limit=20).
 * Unknown query parameters are stripped (ignored).
 */
export const getInvoicesQuerySchema = z
  .object({
    /** Filter by invoice validation status (PENDING, VALIDATED, DISCREPANCY, CANCELLED) */
    status: z
      .enum(['PENDING', 'VALIDATED', 'DISCREPANCY', 'CANCELLED'], {
        message: 'Estado inválido',
      })
      .optional(),

    /** Filter by payment status (PENDING_PAYMENT, PAID) */
    paymentStatus: z
      .enum(['PENDING_PAYMENT', 'PAID'], {
        message: 'Estado de pago inválido',
      })
      .optional(),

    /** Filter by client ID */
    clientId: z.string().cuid('ID de cliente inválido').optional(),

    /** Filter by insurer ID */
    insurerId: z.string().cuid('ID de aseguradora inválido').optional(),

    /** Search by invoice number (case-insensitive, partial match) */
    search: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, 'Búsqueda debe tener al menos 3 caracteres')
      .max(50, 'Búsqueda no puede exceder 50 caracteres')
      .optional(),

    /** Page number (default: 1) */
    page: z.coerce.number().int().min(1, 'Página debe ser mayor o igual a 1').default(1),

    /** Items per page (default: 20, max: 100) */
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
export type GetInvoicesQuery = z.infer<typeof getInvoicesQuerySchema>
