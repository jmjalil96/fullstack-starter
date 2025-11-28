/**
 * editAgent.service.ts
 * Service for editing agent information
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { EditAgentResponse } from './editAgent.dto.js'
import type { EditAgentInput } from './editAgent.schema.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Edit an agent's information
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES can edit agents
 */
export async function editAgent(
  userId: string,
  agentId: string,
  data: EditAgentInput
): Promise<EditAgentResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized agent edit attempt')
    throw new ForbiddenError('No tienes permiso para editar agentes')
  }

  // STEP 3: Find Agent
  const agent = await db.agent.findUnique({
    where: { id: agentId },
  })

  if (!agent) {
    throw new NotFoundError('Agente no encontrado')
  }

  // STEP 4: Validate Agent Code Uniqueness (if changing)
  if (data.agentCode && data.agentCode !== agent.agentCode) {
    const existing = await db.agent.findUnique({
      where: { agentCode: data.agentCode },
    })
    if (existing) {
      throw new ConflictError('El código de agente ya está en uso')
    }
  }

  // STEP 5: Update Agent and Handle Deactivation
  const isDeactivating = data.isActive === false && agent.isActive === true

  const updated = await db.$transaction(async (tx) => {
    // Update agent
    const result = await tx.agent.update({
      where: { id: agentId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.agentCode !== undefined && { agentCode: data.agentCode }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    // If deactivating and agent has a user account, delete their sessions
    if (isDeactivating && agent.userId) {
      await tx.session.deleteMany({
        where: { userId: agent.userId },
      })
    }

    return result
  })

  logger.info({ userId, agentId, changes: data, deactivated: isDeactivating }, 'Agent edited')

  return {
    id: updated.id,
    firstName: updated.firstName,
    lastName: updated.lastName,
    email: updated.email,
    phone: updated.phone,
    agentCode: updated.agentCode,
    isActive: updated.isActive,
    message: 'Agente actualizado exitosamente',
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      globalRole: { select: { name: true } },
    },
  })
}
