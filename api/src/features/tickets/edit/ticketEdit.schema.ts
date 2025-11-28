/**
 * Validation schema for ticket editing endpoint (PATCH /api/tickets/:id)
 */

import { z } from 'zod'

/**
 * Path parameter validation
 */
export const ticketIdParamSchema = z.object({
  id: z.string().cuid('ID de ticket inválido'),
})

/**
 * Body validation schema for ticket updates
 *
 * All fields optional (partial update pattern).
 * Unknown fields are stripped.
 * At least one field must be provided.
 */
export const ticketUpdateSchema = z
  .object({
    /** Ticket status */
    status: z
      .enum(['OPEN', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'RESOLVED', 'CLOSED'], {
        message: 'Estado inválido',
      })
      .optional(),

    /** Ticket priority */
    priority: z
      .enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'], {
        message: 'Prioridad inválida',
      })
      .optional(),

    /** Ticket category (can be null to clear) */
    category: z
      .string({ message: 'La categoría debe ser texto' })
      .trim()
      .max(100, 'La categoría no puede exceder 100 caracteres')
      .nullable()
      .optional(),
  })
  .strip()
  .superRefine((data, ctx) => {
    const hasAnyValue = Object.values(data).some((v) => v !== undefined)
    if (!hasAnyValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe proporcionar al menos un campo para actualizar',
      })
    }
  })

/**
 * Inferred TypeScript types from schemas
 */
export type TicketIdParam = z.infer<typeof ticketIdParamSchema>
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>
