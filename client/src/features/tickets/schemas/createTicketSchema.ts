/**
 * Validation schema for ticket creation
 *
 * Mirrors backend validation from: api/src/features/tickets/new/createTicket.schema.ts
 */

import { z } from 'zod'

/**
 * Ticket create validation schema
 *
 * Required fields:
 * - subject: 1-200 chars
 * - message: 1-5000 chars
 *
 * Optional fields:
 * - priority: enum (LOW, NORMAL, HIGH, URGENT), defaults to NORMAL
 * - category: max 100 chars
 */
export const createTicketSchema = z
  .object({
    /** Client ID (required when user has multiple clients) */
    clientId: z.string().optional(),

    /** Ticket subject (required) */
    subject: z
      .string({ message: 'El asunto es requerido' })
      .trim()
      .min(1, 'El asunto es requerido')
      .max(200, 'El asunto no puede exceder 200 caracteres'),

    /** Initial message (required) */
    message: z
      .string({ message: 'El mensaje es requerido' })
      .trim()
      .min(1, 'El mensaje es requerido')
      .max(5000, 'El mensaje no puede exceder 5000 caracteres'),

    /** Priority level */
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),

    /** Category (optional) */
    category: z
      .string()
      .trim()
      .max(100, 'La categoría no puede exceder 100 caracteres')
      .or(z.literal(''))
      .optional(),
  })
  .strip()

/**
 * Inferred type from schema
 */
export type CreateTicketFormData = z.infer<typeof createTicketSchema>

/**
 * Default values for create form
 */
export const getCreateTicketDefaults = (): CreateTicketFormData => ({
  clientId: undefined,
  subject: '',
  message: '',
  priority: 'NORMAL',
  category: '',
})
