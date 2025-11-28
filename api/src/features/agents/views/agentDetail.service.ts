/**
 * agentDetail.service.ts
 * Service for getting agent details with role-based authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { AgentDetailResponse } from './agentDetail.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type (returned from getUserWithContext)
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Get agent details by ID
 *
 * Role-based authorization:
 * - BROKER_EMPLOYEES only: Can view any agent
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden (admin feature)
 *
 * @param userId - ID of user requesting agent details
 * @param agentId - ID of the agent to retrieve
 * @returns Complete agent details
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role cannot view agents
 * @throws {NotFoundError} If agent not found
 */
export async function getAgentById(
  userId: string,
  agentId: string
): Promise<AgentDetailResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (BROKER_EMPLOYEES only)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName, agentId }, 'Unauthorized agent detail access attempt')
    throw new ForbiddenError('No tienes permiso para ver agentes')
  }

  // STEP 3: Load Agent
  const agent = await db.agent.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      agentCode: true,
      userId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  // STEP 4: Validate Agent Exists
  if (!agent) {
    logger.warn({ userId, agentId }, 'Agent not found')
    throw new NotFoundError('Agente no encontrado')
  }

  // STEP 5: Transform to Response DTO
  const response: AgentDetailResponse = {
    id: agent.id,
    firstName: agent.firstName,
    lastName: agent.lastName,
    email: agent.email,
    phone: agent.phone,
    agentCode: agent.agentCode,
    userId: agent.userId,
    hasUserAccount: agent.userId !== null,
    isActive: agent.isActive,
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
  }

  // STEP 6: Log Activity
  logger.info(
    {
      userId,
      role: roleName,
      agentId,
      agentName: `${agent.firstName} ${agent.lastName}`,
    },
    'Agent detail retrieved'
  )

  // STEP 7: Return Response
  return response
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with role context
 *
 * @param userId - User ID to load
 * @returns User with role data
 */
async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      globalRole: {
        select: { name: true },
      },
    },
  })
}
