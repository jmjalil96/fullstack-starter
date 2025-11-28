/**
 * Validation schema for ticket detail endpoint
 */

import { z } from 'zod'

/**
 * Path parameter validation for GET /api/tickets/:id
 */
export const ticketIdParamSchema = z.object({
  id: z.string().cuid('ID de ticket inválido'),
})

/**
 * Inferred TypeScript type from schema
 */
export type TicketIdParam = z.infer<typeof ticketIdParamSchema>
