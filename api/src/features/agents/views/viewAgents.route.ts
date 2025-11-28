/**
 * viewAgents.route.ts
 * Route for viewing and listing agents
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { agentIdParamSchema, type AgentIdParam } from './agentDetail.schema.js'
import { getAgentById } from './agentDetail.service.js'
import { getAgentsQuerySchema, type GetAgentsQuery } from './viewAgents.schema.js'
import { getAgents } from './viewAgents.service.js'

const router = Router()

/**
 * GET /api/agents
 * Get paginated list of agents
 *
 * Authorization: BROKER_EMPLOYEES only
 */
router.get(
  '/agents',
  requireAuth,
  validateRequest({ query: getAgentsQuerySchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }

    const query = req.query as unknown as GetAgentsQuery
    const response = await getAgents(user.id, query)

    res.status(200).json(response)
  })
)

/**
 * GET /api/agents/:id
 * Get complete agent detail by ID
 *
 * Authorization: BROKER_EMPLOYEES only
 */
router.get(
  '/agents/:id',
  requireAuth,
  validateRequest({ params: agentIdParamSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }

    const { id } = req.params as AgentIdParam
    const agent = await getAgentById(user.id, id)

    res.status(200).json(agent)
  })
)

export default router
