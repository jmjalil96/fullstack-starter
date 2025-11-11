/**
 * createPolicy.service.ts
 * Service for creating new policies with validation and authorization
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

import type { CreatePolicyResponse } from './createPolicy.dto.js'
import type { CreatePolicyInput } from './createPolicy.schema.js'

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
 * Create a new policy
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE) can create policies
 * - CLIENT_ADMIN and AFFILIATE cannot create policies
 *
 * Validation:
 * - policyNumber must be unique (enforced by database constraint + race condition handling)
 * - Client and Insurer must exist and be active
 * - endDate > startDate (validated by Zod schema)
 * - All required fields validated by Zod schema
 * - policyNumber already normalized (trimmed, uppercased) by Zod schema
 *
 * @param userId - ID of user creating the policy
 * @param data - Policy data from request (validated and parsed by Zod, dates are Date objects)
 * @returns Created policy
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role not allowed
 * @throws {NotFoundError} If client or insurer not found
 * @throws {BadRequestError} If client or insurer inactive
 * @throws {ConflictError} If policyNumber already exists (pre-check or race condition)
 */
export async function createPolicy(
  userId: string,
  data: CreatePolicyInput
): Promise<CreatePolicyResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (only broker employees)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized policy creation attempt')
    throw new ForbiddenError('No tienes permiso para crear pólizas')
  }

  // STEP 3: Check policyNumber Uniqueness (pre-check to fail fast)
  const existingPolicy = await db.policy.findUnique({
    where: { policyNumber: data.policyNumber },
    select: { id: true, policyNumber: true },
  })

  if (existingPolicy) {
    logger.warn(
      { userId, policyNumber: data.policyNumber, existingPolicyId: existingPolicy.id },
      'Attempted to create policy with duplicate policyNumber'
    )
    throw new ConflictError(`Ya existe una póliza con el número ${data.policyNumber}`)
  }

  // STEP 4: Validate Client & Insurer Exist and Are Active
  const [client, insurer] = await Promise.all([
    db.client.findUnique({
      where: { id: data.clientId },
      select: { id: true, name: true, isActive: true },
    }),
    db.insurer.findUnique({
      where: { id: data.insurerId },
      select: { id: true, name: true, isActive: true },
    }),
  ])

  if (!client) {
    throw new NotFoundError('Cliente no encontrado')
  }

  if (!client.isActive) {
    throw new BadRequestError('Cliente inactivo')
  }

  if (!insurer) {
    throw new NotFoundError('Aseguradora no encontrada')
  }

  if (!insurer.isActive) {
    throw new BadRequestError('Aseguradora inactiva')
  }

  // STEP 5: Create Policy (with race condition handling)
  let policy
  try {
    policy = await db.policy.create({
      data: {
        policyNumber: data.policyNumber,
        clientId: data.clientId,
        insurerId: data.insurerId,
        type: data.type ?? null,
        status: 'PENDING',
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: true,
        // All copays/premiums default to null (not in request)
      },
      include: {
        client: {
          select: { name: true },
        },
        insurer: {
          select: { name: true },
        },
      },
    })
  } catch (err) {
    // Handle race condition: another request created policy with same policyNumber
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const target = err.meta?.target as string[] | undefined
        if (target && target.includes('policyNumber')) {
          logger.warn(
            { userId, policyNumber: data.policyNumber, error: err.code },
            'Race condition: duplicate policyNumber detected at database level'
          )
          throw new ConflictError(`Ya existe una póliza con el número ${data.policyNumber}`)
        }
      }
    }
    // Re-throw unexpected errors
    throw err
  }

  // STEP 6: Log Activity
  logger.info(
    {
      userId,
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      clientId: policy.clientId,
      insurerId: policy.insurerId,
    },
    'Policy created'
  )

  // STEP 7: Transform to Response DTO
  const response: CreatePolicyResponse = {
    id: policy.id,
    policyNumber: policy.policyNumber,
    status: policy.status as CreatePolicyResponse['status'],
    type: policy.type,
    clientId: policy.clientId,
    clientName: policy.client.name,
    insurerId: policy.insurerId,
    insurerName: policy.insurer.name,
    startDate: policy.startDate.toISOString().split('T')[0],
    endDate: policy.endDate.toISOString().split('T')[0],
    isActive: policy.isActive,
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString(),
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
