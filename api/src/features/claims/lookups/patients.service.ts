/**
 * patients.service.ts
 * Service for fetching available patients for claim creation
 *
 * SECURITY: AFFILIATE users can only query their own affiliate ID (not any affiliate in their client)
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { ALL_AUTHORIZED_ROLES } from '../../../shared/constants/roles.js'
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { AvailablePatientResponse } from './patients.dto.js'

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
 * Get available patients for a specific affiliate
 *
 * Authorization by role:
 * - BROKER_EMPLOYEES: Any affiliate's patients
 * - CLIENT_ADMIN: Any affiliate's patients (if they have access to the client)
 * - AFFILIATE: ONLY their own affiliate ID (prevents accessing other customers' families)
 *
 * @param userId - ID of user requesting patients
 * @param affiliateId - Affiliate to get patients for (titular + dependents)
 * @returns Array of patients user can select (affiliate + dependents)
 */
export async function getAvailablePatients(
  userId: string,
  affiliateId: string
): Promise<AvailablePatientResponse[]> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !ALL_AUTHORIZED_ROLES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized patient list access attempt')
    throw new ForbiddenError('No tienes permiso para ver pacientes')
  }

  // STEP 3: Determine Role Type
  const isClientAdmin = roleName === 'CLIENT_ADMIN'
  const isAffiliate = roleName === 'AFFILIATE'

  // SECURITY FIX: AFFILIATE can only query their OWN affiliate ID
  if (isAffiliate) {
    if (affiliateId !== user.affiliate?.id) {
      logger.warn(
        { userId, requestedAffiliate: affiliateId, userAffiliate: user.affiliate?.id },
        'AFFILIATE attempted to access another affiliates patients - BLOCKED'
      )
      throw new ForbiddenError('Solo puedes ver tus propios pacientes')
    }
  }

  // STEP 4: Load Affiliate to Validate Access
  const affiliate = await db.affiliate.findUnique({
    where: { id: affiliateId },
    select: { id: true, clientId: true, isActive: true },
  })

  if (!affiliate) {
    throw new NotFoundError('Afiliado no encontrado')
  }

  if (!affiliate.isActive) {
    throw new BadRequestError('Afiliado inactivo')
  }

  // STEP 5: Validate User Has Access to Affiliates Client (for non-AFFILIATE roles)
  if (isClientAdmin) {
    const hasClientAccess = user.clientAccess.some((uc) => uc.clientId === affiliate.clientId)
    if (!hasClientAccess) {
      logger.warn({ userId, requestedClient: affiliate.clientId, accessibleClients: user.clientAccess.map(c => c.clientId) }, 'CLIENT_ADMIN attempted to access unauthorized client patients')
      throw new ForbiddenError('No tienes acceso a este cliente')
    }
  }
  // Broker employees can access any affiliate - no check needed
  // AFFILIATE already validated in step 3 that they can only query their own ID

  // STEP 6: Query Patients (Affiliate + Dependents)
  const patients = await db.affiliate.findMany({
    where: {
      OR: [
        { id: affiliateId }, // The affiliate themselves
        { primaryAffiliateId: affiliateId }, // Their dependents
      ],
      clientId: affiliate.clientId, // Extra safety: constrain to validated client
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })

  // STEP 7: Map to Include Relationship
  const patientsWithRelationship: AvailablePatientResponse[] = patients.map((patient) => ({
    ...patient,
    relationship: patient.id === affiliateId ? 'self' : ('dependent' as const),
  }))

  // Sort to put 'self' first
  patientsWithRelationship.sort((a, b) => {
    if (a.relationship === 'self') return -1
    if (b.relationship === 'self') return 1
    return 0
  })

  logger.info({ userId, affiliateId, count: patientsWithRelationship.length, role: roleName }, 'Retrieved available patients for claims')

  return patientsWithRelationship
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
