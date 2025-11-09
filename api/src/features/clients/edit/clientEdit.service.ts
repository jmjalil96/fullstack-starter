/**
 * clientEdit.service.ts
 * Service for updating clients with validation and role-based authorization
 *
 * Much simpler than claim editing:
 * - No lifecycle state machine
 * - All fields editable anytime
 * - Only taxId uniqueness validation needed
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { UpdateClientResponse } from './clientEdit.dto.js'
import type { UpdateClientInput } from './clientEdit.schema.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type (duplicated across services; consider extracting later)
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Update a client with partial updates
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE) can edit
 * - CLIENT_ADMIN and AFFILIATE have read-only access
 * - No resource-level access check needed (broker employees can edit any client)
 *
 * Validation:
 * - taxId uniqueness if changed
 * - At least one field must be provided (Zod superRefine)
 * - Contact fields (email, phone, address) can be set to null to clear
 *
 * @param userId - ID of the requesting user
 * @param clientId - ID of the client to update (CUID)
 * @param updates - Parsed updates from Zod
 * @returns Updated client as ClientDetailResponse
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role cannot edit clients
 * @throws {NotFoundError} If client not found
 * @throws {BadRequestError} If updates are empty
 * @throws {ConflictError} If taxId already exists
 */
export async function updateClient(
  userId: string,
  clientId: string,
  updates: UpdateClientInput
): Promise<UpdateClientResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (only broker employees)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName, clientId }, 'Unauthorized client edit attempt')
    throw new ForbiddenError('No tienes permiso para editar clientes')
  }

  // STEP 3: Load Current Client
  const currentClient = await db.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      name: true,
      taxId: true,
      email: true,
      phone: true,
      address: true,
      isActive: true,
    },
  })

  if (!currentClient) {
    logger.warn({ userId, clientId }, 'Client not found for update')
    throw new NotFoundError('Cliente no encontrado')
  }

  // STEP 4: Filter Updates (remove undefined, keep null)
  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  )

  // STEP 5: Validate Non-Empty Update (redundant with Zod superRefine, but defensive)
  if (Object.keys(filteredUpdates).length === 0) {
    throw new BadRequestError('Debe proporcionar al menos un campo para actualizar')
  }

  // STEP 6: Validate taxId Uniqueness (if changed)
  if (updates.taxId && updates.taxId !== currentClient.taxId) {
    const existingClient = await db.client.findUnique({
      where: { taxId: updates.taxId },
      select: { id: true, name: true },
    })

    if (existingClient && existingClient.id !== clientId) {
      logger.warn(
        { userId, clientId, newTaxId: updates.taxId, existingClientId: existingClient.id },
        'Attempted to update to duplicate taxId'
      )
      throw new ConflictError(`Ya existe un cliente con el RUC/Tax ID ${updates.taxId}`)
    }
  }

  // STEP 7: Update Client (with race condition handling)
  let updatedClient
  try {
    updatedClient = await db.client.update({
      where: { id: clientId },
      data: filteredUpdates,
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
  } catch (err) {
    // Handle race condition: another request updated to same taxId
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const target = err.meta?.target as string[] | undefined
        if (target && target.includes('taxId')) {
          logger.warn(
            { userId, clientId, newTaxId: updates.taxId, error: err.code },
            'Race condition: duplicate taxId detected at database level'
          )
          throw new ConflictError(`Ya existe un cliente con el RUC/Tax ID ${updates.taxId}`)
        }
      }
    }
    // Re-throw unexpected errors
    throw err
  }

  // STEP 8: Transform to Response DTO
  const response: UpdateClientResponse = {
    id: updatedClient.id,
    name: updatedClient.name,
    taxId: updatedClient.taxId,
    email: updatedClient.email,
    phone: updatedClient.phone,
    address: updatedClient.address,
    isActive: updatedClient.isActive,
    createdAt: updatedClient.createdAt.toISOString(),
    updatedAt: updatedClient.updatedAt.toISOString(),
  }

  // STEP 9: Log Activity
  logger.info(
    {
      userId,
      role: roleName,
      clientId,
      clientName: updatedClient.name,
      updatedFields: Object.keys(filteredUpdates),
    },
    'Client updated'
  )

  // STEP 10: Return Response
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
