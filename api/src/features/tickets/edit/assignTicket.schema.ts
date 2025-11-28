/**
 * Validation schema for ticket assignment endpoint (PATCH /api/tickets/:id/assign)
 */

import { z } from 'zod'

/**
 * Path parameter validation
 */
export const ticketIdParamSchema = z.object({
  id: z.string().cuid('ID de ticket inválido'),
})

/**
 * Body validation schema for ticket assignment
 */
export const assignTicketSchema = z.object({
  /** User ID to assign (null to unassign) - uses string since BetterAuth IDs are UUIDs */
  assignedToId: z
    .string()
    .min(1, 'ID de usuario inválido')
    .nullable(),
})

/**
 * Inferred TypeScript types from schemas
 */
export type TicketIdParam = z.infer<typeof ticketIdParamSchema>
export type AssignTicketInput = z.infer<typeof assignTicketSchema>
