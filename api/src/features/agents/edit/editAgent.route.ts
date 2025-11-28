/**
 * editAgent.route.ts
 * Route for editing agents
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import {
  agentIdParamSchema,
  editAgentSchema,
  type AgentIdParam,
  type EditAgentInput,
} from './editAgent.schema.js'
import { editAgent } from './editAgent.service.js'

const router = Router()

/**
 * PATCH /api/agents/:id
 * Edit an agent's information
 *
 * Authorization: BROKER_EMPLOYEES only
 */
router.patch(
  '/agents/:id',
  requireAuth,
  validateRequest({ params: agentIdParamSchema, body: editAgentSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }

    const { id } = req.params as AgentIdParam
    const data = req.body as EditAgentInput

    const response = await editAgent(user.id, id, data)

    res.status(200).json(response)
  })
)

export default router
