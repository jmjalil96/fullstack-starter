/**
 * Validation schema for adding messages to tickets
 */

import { z } from 'zod'

/**
 * Path parameter validation for POST /api/tickets/:id/messages
 */
export const ticketIdParamSchema = z.object({
  id: z.string().cuid('ID de ticket inválido'),
})

/**
 * Request body validation for POST /api/tickets/:id/messages
 */
export const addMessageSchema = z
  .object({
    /** Message content */
    message: z
      .string({ message: 'El mensaje es requerido' })
      .trim()
      .min(1, 'El mensaje debe tener al menos 1 caracter')
      .max(5000, 'El mensaje no puede exceder 5000 caracteres'),
  })
  .strip()

/**
 * Inferred TypeScript types from schemas
 */
export type TicketIdParam = z.infer<typeof ticketIdParamSchema>
export type AddMessageInput = z.infer<typeof addMessageSchema>
