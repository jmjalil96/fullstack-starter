/**
 * Validation schema for creating tickets
 */

import { z } from 'zod'

/**
 * Request body validation for POST /api/tickets
 *
 * Creates a new support ticket with an initial message.
 * Unknown fields are stripped.
 */
export const createTicketSchema = z
  .object({
    /** Ticket subject/title */
    subject: z
      .string({ message: 'El asunto es requerido' })
      .trim()
      .min(1, 'El asunto debe tener al menos 1 caracter')
      .max(200, 'El asunto no puede exceder 200 caracteres'),

    /** Initial message content */
    message: z
      .string({ message: 'El mensaje es requerido' })
      .trim()
      .min(1, 'El mensaje debe tener al menos 1 caracter')
      .max(5000, 'El mensaje no puede exceder 5000 caracteres'),

    /** Ticket priority */
    priority: z
      .enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'], {
        message: 'Prioridad inválida',
      })
      .optional(),

    /** Ticket category */
    category: z
      .string()
      .trim()
      .max(100, 'La categoría no puede exceder 100 caracteres')
      .optional(),

    /** Client ID */
    clientId: z
      .string({ message: 'El cliente es requerido' })
      .cuid('ID de cliente inválido'),

    /** Reporter ID (client user reporting the issue) */
    reporterId: z
      .string()
      .cuid('ID de reportador inválido')
      .optional(),

    /** Related claim ID */
    relatedClaimId: z
      .string()
      .cuid('ID de reclamo inválido')
      .optional(),

    /** Assigned employee ID */
    assignedToId: z
      .string()
      .cuid('ID de asignado inválido')
      .optional(),
  })
  .strip()

/**
 * Inferred TypeScript type from schema
 */
export type CreateTicketInput = z.infer<typeof createTicketSchema>
