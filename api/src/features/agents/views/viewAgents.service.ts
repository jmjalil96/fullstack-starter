/**
 * viewAgents.service.ts
 * Service for viewing and listing agents
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type {
  AgentListItemResponse,
  GetAgentsQueryParams,
  GetAgentsResponse,
  PaginationMetadata,
} from './viewAgents.dto.js'

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
 * Get agents based on query filters
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES can view agents
 */
export async function getAgents(
  userId: string,
  query: GetAgentsQueryParams
): Promise<GetAgentsResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized agents list access attempt')
    throw new ForbiddenError('No tienes permiso para ver agentes')
  }

  // STEP 3: Build WHERE Clause
  const where: Prisma.AgentWhereInput = {}

  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { agentCode: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive
  }

  // STEP 4: Pagination
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const skip = (page - 1) * limit

  // STEP 5: Execute Queries
  const [agents, total] = await Promise.all([
    db.agent.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
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
      },
    }),
    db.agent.count({ where }),
  ])

  // STEP 6: Transform
  const transformed: AgentListItemResponse[] = agents.map((a) => ({
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    email: a.email,
    phone: a.phone,
    agentCode: a.agentCode,
    userId: a.userId,
    hasUserAccount: a.userId !== null,
    isActive: a.isActive,
    createdAt: a.createdAt.toISOString(),
  }))

  // STEP 7: Pagination Metadata
  const totalPages = Math.ceil(total / limit)
  const pagination: PaginationMetadata = {
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  }

  logger.info({ userId, resultCount: transformed.length, total }, 'Agents retrieved')

  return { agents: transformed, pagination }
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
