/**
 * Validation schema for agent detail endpoint (GET /api/agents/:id)
 */

import { z } from 'zod'

/**
 * Path parameter validation for GET /api/agents/:id
 *
 * Validates the agent ID is a valid CUID format.
 */
export const agentIdParamSchema = z.object({
  id: z.string().cuid('ID de agente inválido'),
})

/**
 * Inferred TypeScript type from schema
 */
export type AgentIdParam = z.infer<typeof agentIdParamSchema>
