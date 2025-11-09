/**
 * createClient.service.ts
 * Service for creating new clients with validation and authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { CreateClientRequest, CreateClientResponse } from './createClient.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// User context type (returned from getUserWithContext)
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Create a new client
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE) can create clients
 * - CLIENT_ADMIN and AFFILIATE cannot create clients
 *
 * Validation:
 * - taxId must be unique (enforced by database constraint + race condition handling)
 * - All required fields validated by Zod schema
 * - taxId already normalized (trimmed, digits-only) by Zod schema
 *
 * @param userId - ID of user creating the client
 * @param data - Client data from request (validated by Zod)
 * @returns Created client
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role not allowed
 * @throws {ConflictError} If taxId already exists (pre-check or race condition)
 */
export async function createClient(
  userId: string,
  data: CreateClientRequest
): Promise<CreateClientResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (only broker employees)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized client creation attempt')
    throw new ForbiddenError('No tienes permiso para crear clientes')
  }

  // STEP 3: Check taxId Uniqueness (pre-check to fail fast)
  const existingClient = await db.client.findUnique({
    where: { taxId: data.taxId },
    select: { id: true, name: true },
  })

  if (existingClient) {
    logger.warn(
      { userId, taxId: data.taxId, existingClientId: existingClient.id },
      'Attempted to create client with duplicate taxId'
    )
    throw new ConflictError(`Ya existe un cliente con el RUC/Tax ID ${data.taxId}`)
  }

  // STEP 4: Create Client (with race condition handling)
  let client
  try {
    client = await db.client.create({
      data: {
        name: data.name,
        taxId: data.taxId,
        email: data.email ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        // isActive defaults to true (defined in schema)
      },
    })
  } catch (err) {
    // Handle race condition: another request created client with same taxId
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const target = err.meta?.target as string[] | undefined
        if (target && target.includes('taxId')) {
          logger.warn(
            { userId, taxId: data.taxId, error: err.code },
            'Race condition: duplicate taxId detected at database level'
          )
          throw new ConflictError(`Ya existe un cliente con el RUC/Tax ID ${data.taxId}`)
        }
      }
    }
    // Re-throw unexpected errors
    throw err
  }

  // STEP 5: Log Activity
  logger.info(
    {
      userId,
      clientId: client.id,
      clientName: client.name,
      taxId: client.taxId,
    },
    'Client created'
  )

  // STEP 6: Transform to Response DTO
  const response: CreateClientResponse = {
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
