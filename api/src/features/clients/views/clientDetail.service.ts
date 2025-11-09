/**
 * clientDetail.service.ts
 * Service for fetching a single client detail with role-based authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { ALL_AUTHORIZED_ROLES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { ClientDetailResponse } from './clientDetail.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type (duplicated across services; consider extracting later)
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
 * Get complete client detail by ID with role-based authorization
 *
 * Role-based access:
 * - SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE: Can view any client
 * - CLIENT_ADMIN: Can view clients in their accessible clients list
 * - AFFILIATE: Can view only their own client
 *
 * Security:
 * - Returns 404 if client does not exist OR user lacks access (avoid leaking existence)
 *
 * @param userId - ID of the requesting user
 * @param clientId - ID of the client to fetch (CUID)
 * @returns ClientDetailResponse (flat DTO with all client fields)
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role is not permitted
 * @throws {NotFoundError} If client not found or user has no access
 */
export async function getClientById(
  userId: string,
  clientId: string
): Promise<ClientDetailResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !ALL_AUTHORIZED_ROLES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized client detail access attempt')
    throw new ForbiddenError('No tienes permiso para ver clientes')
  }

  // STEP 3: Query Client (all fields)
  const client = await db.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      name: true,
      taxId: true,
      email: true,
      phone: true,
      address: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  // STEP 4: Validate Client Exists
  if (!client) {
    logger.warn({ userId, clientId }, 'Client not found')
    throw new NotFoundError('Cliente no encontrado')
  }

  // STEP 5: Role-Based Access Validation
  const isAffiliate = roleName === 'AFFILIATE'
  const isClientAdmin = roleName === 'CLIENT_ADMIN'

  if (isAffiliate) {
    // AFFILIATE can only view their own client
    if (!user.affiliate) {
      logger.warn({ userId }, 'AFFILIATE has no affiliate record')
      throw new NotFoundError('Cliente no encontrado')
    }

    if (client.id !== user.affiliate.clientId) {
      logger.warn(
        { userId, clientId, userClientId: user.affiliate.clientId },
        'AFFILIATE attempted to access another client'
      )
      throw new NotFoundError('Cliente no encontrado')
    }
  } else if (isClientAdmin) {
    // CLIENT_ADMIN can only view clients in their accessible list
    const hasAccess = user.clientAccess.some((uc) => uc.clientId === client.id)
    if (!hasAccess) {
      logger.warn(
        { userId, clientId, accessibleClients: user.clientAccess.map((c) => c.clientId) },
        'CLIENT_ADMIN attempted unauthorized client access'
      )
      throw new NotFoundError('Cliente no encontrado')
    }
  }
  // BROKER EMPLOYEES have access to any client - no additional checks needed

  // STEP 6: Transform to Response DTO
  const response: ClientDetailResponse = {
    id: client.id,
    name: client.name,
    taxId: client.taxId,
    email: client.email,
    phone: client.phone,
    address: client.address,
    isActive: client.isActive,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  }

  // STEP 7: Log Activity
  logger.info(
    { userId, role: roleName, clientId, clientName: client.name },
    'Client detail retrieved'
  )

  return response
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with all context needed for authorization
 *
 * @param userId - User ID to load
 * @returns User with role, affiliate, and client access data
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
