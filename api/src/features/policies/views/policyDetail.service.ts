/**
 * policyDetail.service.ts
 * Service for fetching a single policy detail with role-based authorization
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

import type { PolicyDetailResponse } from './policyDetail.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type
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
 * Get complete policy detail by ID with role-based authorization
 *
 * Role-based access:
 * - BROKER_EMPLOYEES: Can view any policy
 * - CLIENT_ADMIN: Can view policies from accessible clients only
 * - AFFILIATE: Cannot access (403 Forbidden)
 *
 * Security:
 * - Returns 404 if policy does not exist OR user lacks access (avoids info disclosure)
 *
 * @param userId - ID of the requesting user
 * @param policyId - ID of the policy to fetch (CUID)
 * @returns PolicyDetailResponse (flat DTO with all policy fields)
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role is not permitted
 * @throws {NotFoundError} If policy not found or user lacks access
 */
export async function getPolicyById(
  userId: string,
  policyId: string
): Promise<PolicyDetailResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name
  const isBrokerEmployee = roleName ? BROKER_EMPLOYEES.includes(roleName as never) : false
  const isClientAdmin = roleName === 'CLIENT_ADMIN'

  if (!isBrokerEmployee && !isClientAdmin) {
    logger.warn({ userId, role: roleName }, 'Unauthorized policy detail access attempt')
    throw new ForbiddenError('No tienes permiso para ver pólizas')
  }

  // STEP 3: Query Policy with Relations
  const policy = await db.policy.findUnique({
    where: { id: policyId },
    select: {
      id: true,
      policyNumber: true,
      status: true,
      type: true,
      ambCopay: true,
      hospCopay: true,
      maternity: true,
      tPremium: true,
      tplus1Premium: true,
      tplusfPremium: true,
      taxRate: true,
      additionalCosts: true,
      startDate: true,
      endDate: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      clientId: true,
      insurerId: true,
      client: {
        select: { name: true },
      },
      insurer: {
        select: { name: true },
      },
    },
  })

  // STEP 4: Validate Policy Exists
  if (!policy) {
    logger.warn({ userId, policyId }, 'Policy not found')
    throw new NotFoundError('Póliza no encontrada')
  }

  // STEP 5: Role-Based Access Validation
  if (isClientAdmin) {
    // CLIENT_ADMIN: Can only view policies from accessible clients
    const hasAccess = user.clientAccess.some((uc) => uc.clientId === policy.clientId)
    if (!hasAccess) {
      logger.warn(
        { userId, policyId, policyClientId: policy.clientId, accessibleClients: user.clientAccess.map((c) => c.clientId) },
        'CLIENT_ADMIN attempted unauthorized policy access'
      )
      throw new NotFoundError('Póliza no encontrada') // 404, not 403 (security)
    }
  }
  // BROKER_EMPLOYEES: No validation needed (full access)

  // STEP 6: Transform to Response DTO
  const response: PolicyDetailResponse = {
    id: policy.id,
    policyNumber: policy.policyNumber,
    status: policy.status as PolicyDetailResponse['status'],
    type: policy.type,
    ambCopay: policy.ambCopay,
    hospCopay: policy.hospCopay,
    maternity: policy.maternity,
    tPremium: policy.tPremium,
    tplus1Premium: policy.tplus1Premium,
    tplusfPremium: policy.tplusfPremium,
    taxRate: policy.taxRate,
    additionalCosts: policy.additionalCosts,
    startDate: policy.startDate.toISOString().split('T')[0],
    endDate: policy.endDate.toISOString().split('T')[0],
    isActive: policy.isActive,
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString(),
    clientId: policy.clientId,
    clientName: policy.client.name,
    insurerId: policy.insurerId,
    insurerName: policy.insurer.name,
  }

  // STEP 7: Log Activity
  logger.info(
    { userId, role: roleName, policyId, policyNumber: policy.policyNumber },
    'Policy detail retrieved'
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
