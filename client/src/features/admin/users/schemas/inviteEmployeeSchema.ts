/**
 * Invite Employee form validation schema
 * Mirrors backend: api/src/features/invitations/new/inviteEmployee.schema.ts
 */

import { z } from 'zod'

/**
 * Zod schema for invite employee form
 */
export const inviteEmployeeSchema = z.object({
  /** Email address for the invitation */
  email: z
    .string()
    .trim()
    .min(1, 'El correo electrónico es requerido')
    .email('El correo electrónico no es válido'),

  /** Employee first name */
  firstName: z
    .string()
    .trim()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),

  /** Employee last name */
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

  /** Position/job title (optional) */
  position: z
    .string()
    .trim()
    .max(100, 'El cargo no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),

  /** Department (optional) */
  department: z
    .string()
    .trim()
    .max(100, 'El departamento no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),

  /** Employee code (optional) */
  employeeCode: z
    .string()
    .trim()
    .max(50, 'El código de empleado no puede exceder 50 caracteres')
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
export type InviteEmployeeFormData = z.infer<typeof inviteEmployeeSchema>
