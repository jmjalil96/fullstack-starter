/**
 * Validation schema for inviting agents
 */

import { z } from 'zod'

/**
 * Request body validation for POST /api/invitations/agent
 *
 * Email must be unique (not already registered as user).
 * Role must exist and be valid for agents.
 * Unknown fields are stripped.
 */
export const inviteAgentSchema = z
  .object({
    /** Email address for the invitation */
    email: z
      .string({ message: 'El correo electrónico es requerido' })
      .trim()
      .email('Correo electrónico inválido')
      .max(255, 'El correo electrónico no puede exceder 255 caracteres'),

    /** Agent's first name */
    firstName: z
      .string({ message: 'El nombre es requerido' })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),

    /** Agent's last name */
    lastName: z
      .string({ message: 'El apellido es requerido' })
      .trim()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(100, 'El apellido no puede exceder 100 caracteres'),

    /** Agent's phone number (optional) */
    phone: z
      .string()
      .trim()
      .max(50, 'El teléfono no puede exceder 50 caracteres')
      .optional(),

    /** Agent code/ID (optional, must be unique if provided) */
    agentCode: z
      .string()
      .trim()
      .max(50, 'El código de agente no puede exceder 50 caracteres')
      .optional(),

    /** Role ID to assign upon acceptance */
    roleId: z
      .string({ message: 'El rol es requerido' })
      .cuid('ID de rol inválido'),
  })
  .strip()

/**
 * Inferred TypeScript type from schema
 */
export type InviteAgentInput = z.infer<typeof inviteAgentSchema>
