/**
 * Invite Agent form validation schema
 * Mirrors backend: api/src/features/invitations/new/inviteAgent.schema.ts
 */

import { z } from 'zod'

/**
 * Zod schema for invite agent form
 */
export const inviteAgentSchema = z.object({
  /** Email address for the invitation */
  email: z
    .string()
    .trim()
    .min(1, 'El correo electrónico es requerido')
    .email('El correo electrónico no es válido'),

  /** Agent first name */
  firstName: z
    .string()
    .trim()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),

  /** Agent last name */
  lastName: z
    .string()
    .trim()
    .min(1, 'El apellido es requerido')
    .max(100, 'El apellido no puede exceder 100 caracteres'),

  /** Phone number (optional) */
  phone: z
    .string()
    .trim()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('')),

  /** Agent code (optional) */
  agentCode: z
    .string()
    .trim()
    .max(50, 'El código de agente no puede exceder 50 caracteres')
    .optional()
    .or(z.literal('')),

  /** Role ID to assign */
  roleId: z
    .string()
    .min(1, 'El rol es requerido'),
})

/**
 * Inferred TypeScript type for form data
 */
export type InviteAgentFormData = z.infer<typeof inviteAgentSchema>
