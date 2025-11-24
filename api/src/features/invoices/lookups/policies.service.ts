/**
 * policies.service.ts
 * Service for fetching available policies for invoice creation
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { PolicyStatus } from '@prisma/client'

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import { ForbiddenError, UnauthorizedError } from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { AvailablePolicyResponse } from './policies.dto.js'
import type { GetAvailablePoliciesQuery } from './policies.schema.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type (simplified for broker-only access)
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Get available policies for invoice creation
 *
 * @param userId - ID of user requesting available policies
 * @param query - Query parameters (clientId, insurerId)
 * @returns Array of active policies for the client and insurer
 */
export async function getAvailablePolicies(
  userId: string,
  query: GetAvailablePoliciesQuery
): Promise<AvailablePolicyResponse[]> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (broker employees only)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized policies list access attempt')
    throw new ForbiddenError('No tienes permiso para ver pólizas')
  }

  // STEP 3: Query Active Policies for Client + Insurer
  const today = new Date()

  const policies = await db.policy.findMany({
    where: {
      clientId: query.clientId,
      insurerId: query.insurerId,
      status: PolicyStatus.ACTIVE,
      isActive: true,
      startDate: { lte: today },
      endDate: { gte: today },
    },
    select: {
      id: true,
      policyNumber: true,
      type: true,
      startDate: true,
      endDate: true,
    },
    orderBy: { policyNumber: 'asc' },
  })

  // STEP 4: Transform Dates to ISO Strings
  const transformedPolicies: AvailablePolicyResponse[] = policies.map((policy) => ({
    id: policy.id,
    policyNumber: policy.policyNumber,
    type: policy.type,
    startDate: policy.startDate.toISOString().split('T')[0],
    endDate: policy.endDate.toISOString().split('T')[0],
  }))

  // STEP 5: Log Activity
  logger.info(
    { userId, role: roleName, clientId: query.clientId, insurerId: query.insurerId, count: transformedPolicies.length },
    'Broker employee accessed policies for invoice creation'
  )

  // STEP 6: Return Policies
  return transformedPolicies
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
