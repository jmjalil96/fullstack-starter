/**
 * Validation schemas for editing users
 */

import { z } from 'zod'

/**
 * Path parameter validation for user endpoints
 * Note: BetterAuth uses 32-char alphanumeric IDs, not UUIDs
 */
export const userIdParamSchema = z.object({
  id: z.string().min(1, 'ID de usuario requerido'),
})

export type UserIdParam = z.infer<typeof userIdParamSchema>

/**
 * Request body validation for PATCH /api/users/:id
 */
export const editUserSchema = z
  .object({
    /** New global role ID */
    globalRoleId: z.string().cuid('ID de rol inválido').optional(),

    /** New name */
    name: z
      .string()
      .trim()
      .min(2, 'Nombre debe tener al menos 2 caracteres')
      .max(100, 'Nombre no puede exceder 100 caracteres')
      .optional(),
  })
  .strip()
  .refine((data) => data.globalRoleId !== undefined || data.name !== undefined, {
    message: 'Se requiere al menos un campo para actualizar',
  })

export type EditUserInput = z.infer<typeof editUserSchema>

/**
 * Request body validation for PUT /api/users/:id/client-access
 */
export const updateClientAccessSchema = z
  .object({
    /** Array of client IDs to grant access to */
    clientIds: z
      .array(z.string().cuid('ID de cliente inválido'))
      .max(100, 'Máximo 100 clientes por usuario'),
  })
  .strip()

export type UpdateClientAccessInput = z.infer<typeof updateClientAccessSchema>
