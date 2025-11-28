/**
 * clients.service.ts
 * Service for fetching available clients for ticket creation
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { ALL_AUTHORIZED_ROLES, BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import { ForbiddenError, UnauthorizedError } from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { AvailableClientResponse } from './clients.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type for authorization
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
  affiliate: { id: string; clientId: string } | null
  clientAccess: { clientId: string }[]
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Get available clients for ticket creation
 *
 * Authorization by role:
 * - BROKER_EMPLOYEES: All active clients
 * - CLIENT_ADMIN: Their accessible clients (via UserClient)
 * - AFFILIATE: Only their single client
 *
 * @param userId - ID of user requesting available clients
 * @returns Array of clients user can create tickets for
 */
export async function getAvailableClients(userId: string): Promise<AvailableClientResponse[]> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !ALL_AUTHORIZED_ROLES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized client list access attempt')
    throw new ForbiddenError('No tienes permiso para ver clientes')
  }

  // STEP 3: Determine Scope and Query Clients
  const isBrokerEmployee = BROKER_EMPLOYEES.includes(roleName as never)
  const isClientAdmin = roleName === 'CLIENT_ADMIN'
  const isAffiliate = roleName === 'AFFILIATE'

  let clients: AvailableClientResponse[] = []

  if (isBrokerEmployee) {
    // Broker employees see all active clients
    clients = await db.client.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    logger.info({ userId, role: roleName, count: clients.length }, 'Broker employee accessed clients for tickets')
  } else if (isClientAdmin) {
    // CLIENT_ADMIN sees their accessible clients
    const accessibleClientIds = user.clientAccess.map((uc) => uc.clientId)

    if (accessibleClientIds.length === 0) {
      logger.info({ userId }, 'CLIENT_ADMIN has no client access')
      return []
    }

    clients = await db.client.findMany({
      where: {
        id: { in: accessibleClientIds },
        isActive: true,
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    logger.info({ userId, clientIds: accessibleClientIds, count: clients.length }, 'CLIENT_ADMIN accessed clients for tickets')
  } else if (isAffiliate) {
    // AFFILIATE sees only their client
    if (!user.affiliate) {
      logger.warn({ userId }, 'AFFILIATE has no affiliate record')
      return []
    }

    const client = await db.client.findUnique({
      where: { id: user.affiliate.clientId, isActive: true },
      select: { id: true, name: true },
    })

    clients = client ? [client] : []

    logger.info({ userId, clientId: user.affiliate.clientId, found: !!client }, 'AFFILIATE accessed their client for tickets')
  }

  return clients
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with role, affiliate, and client access context for authorization
 *
 * @param userId - User ID to load
 * @returns UserContext or null if not found
 */
async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      globalRole: {
        select: { name: true },
      },
      affiliate: {
        select: { id: true, clientId: true },
      },
      clientAccess: {
        where: { isActive: true },
        select: { clientId: true },
      },
    },
  })
}
