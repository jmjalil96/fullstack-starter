/**
 * Validation schemas for editing agents
 */

import { z } from 'zod'

/**
 * Path parameter validation
 */
export const agentIdParamSchema = z.object({
  id: z.string().cuid('ID de agente inválido'),
})

export type AgentIdParam = z.infer<typeof agentIdParamSchema>

/**
 * Request body validation for PATCH /api/agents/:id
 */
export const editAgentSchema = z
  .object({
    firstName: z.string().trim().min(2).max(100).optional(),
    lastName: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().max(50).nullable().optional(),
    agentCode: z.string().trim().max(50).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strip()
  .refine(
    (data) =>
      data.firstName !== undefined ||
      data.lastName !== undefined ||
      data.phone !== undefined ||
      data.agentCode !== undefined ||
      data.isActive !== undefined,
    { message: 'Se requiere al menos un campo para actualizar' }
  )

export type EditAgentInput = z.infer<typeof editAgentSchema>
