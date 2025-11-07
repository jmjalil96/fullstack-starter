/**
 * newClaim.service.ts
 * Service for creating new claims with full validation and security
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'
import { generateClaimNumber } from '../shared/claimNumber.utils.js'

import type {
  AvailableAffiliateResponse,
  AvailableClientResponse,
  AvailablePatientResponse,
  CreateClaimRequest,
  CreateClaimResponse,
} from './newClaim.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// User context type (returned from getUserWithContext)
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
 * Create a new claim with full validation
 *
 * @param userId - ID of user creating the claim
 * @param data - Claim data from request
 * @returns Created claim with relations
 */
export async function createClaim(
  userId: string,
  data: CreateClaimRequest
): Promise<CreateClaimResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name
  const allowedRoles = [
    'SUPER_ADMIN',
    'CLAIMS_EMPLOYEE',
    'OPERATIONS_EMPLOYEE',
    'ADMIN_EMPLOYEE',
    'CLIENT_ADMIN',
    'AFFILIATE',
  ]

  if (!roleName || !allowedRoles.includes(roleName)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized claim creation attempt')
    throw new ForbiddenError('No tienes permiso para crear reclamos')
  }

  // STEP 3: Client Access Validation
  const isAffiliate = roleName === 'AFFILIATE'
  const isClientAdmin = roleName === 'CLIENT_ADMIN'

  if (isAffiliate) {
    if (data.clientId !== user.affiliate?.clientId) {
      logger.warn({ userId, requestedClient: data.clientId, userClient: user.affiliate?.clientId }, 'Cross-client access attempt')
      throw new ForbiddenError('No puedes crear reclamos para otro cliente')
    }
  } else if (isClientAdmin) {
    const hasClientAccess = user.clientAccess.some((uc) => uc.clientId === data.clientId)
    if (!hasClientAccess) {
      logger.warn({ userId, requestedClient: data.clientId, accessibleClients: user.clientAccess.map(c => c.clientId) }, 'Client access denied')
      throw new ForbiddenError('No tienes acceso a este cliente')
    }
  }
  // Broker employees can access any client

  // STEP 4: Affiliate Ownership Validation
  if (isAffiliate) {
    if (data.affiliateId !== user.affiliate?.id) {
      logger.warn({ userId, requestedAffiliate: data.affiliateId, userAffiliate: user.affiliate?.id }, 'Affiliate impersonation attempt')
      throw new ForbiddenError('Solo puedes crear reclamos para ti mismo')
    }
  }

  // STEP 5: Load Affiliate and Patient Entities
  let affiliate: { id: string; clientId: string; isActive: boolean } | null
  let patient: { id: string; clientId: string; isActive: boolean; primaryAffiliateId: string | null } | null

  if (data.affiliateId === data.patientId) {
    // Self-claim: Query once and reuse for both (performance optimization)
    const entity = await db.affiliate.findUnique({
      where: { id: data.affiliateId },
      select: { id: true, clientId: true, isActive: true, primaryAffiliateId: true },
    })
    affiliate = entity
    patient = entity
  } else {
    // Different entities: Query in parallel
    ;[affiliate, patient] = await Promise.all([
      db.affiliate.findUnique({
        where: { id: data.affiliateId },
        select: { id: true, clientId: true, isActive: true },
      }),
      db.affiliate.findUnique({
        where: { id: data.patientId },
        select: { id: true, clientId: true, isActive: true, primaryAffiliateId: true },
      }),
    ])
  }

  if (!affiliate) {
    throw new NotFoundError('Afiliado no encontrado')
  }

  if (!patient) {
    throw new NotFoundError('Paciente no encontrado')
  }

  // STEP 6: Entity-Level Validations
  if (affiliate.clientId !== data.clientId) {
    logger.warn({ affiliateId: affiliate.id, affiliateClient: affiliate.clientId, requestedClient: data.clientId }, 'Affiliate client mismatch')
    throw new BadRequestError('Afiliado no pertenece a este cliente')
  }

  if (patient.clientId !== data.clientId) {
    logger.warn({ patientId: patient.id, patientClient: patient.clientId, requestedClient: data.clientId }, 'Patient client mismatch')
    throw new BadRequestError('Paciente no pertenece a este cliente')
  }

  if (!affiliate.isActive) {
    throw new BadRequestError('Afiliado inactivo')
  }

  if (!patient.isActive) {
    throw new BadRequestError('Paciente inactivo')
  }

  // STEP 7: Affiliate-Patient Relationship Validation
  const isSelfClaim = patient.id === affiliate.id
  const isDependentClaim = patient.primaryAffiliateId === affiliate.id

  if (!isSelfClaim && !isDependentClaim) {
    logger.warn({ affiliateId: affiliate.id, patientId: patient.id, primaryAffiliateId: patient.primaryAffiliateId }, 'Invalid affiliate-patient relationship')
    throw new BadRequestError('El paciente debe ser el afiliado titular o un dependiente directo')
  }

  // STEP 8-10: Create Claim (atomic transaction)
  const claim = await db.$transaction(async (tx) => {
    // Get next sequence value using PostgreSQL built-in function
    const result = await tx.$queryRaw<[{ nextval: bigint }]>`
      SELECT nextval(pg_get_serial_sequence('"Claim"', 'claimSequence'))
    `
    const claimSequence = Number(result[0].nextval)

    // Generate claim number from sequence
    const claimNumber = generateClaimNumber(claimSequence)

    // Create claim with both values (single atomic operation)
    return await tx.claim.create({
      data: {
        claimSequence,
        claimNumber,
        clientId: data.clientId,
        affiliateId: data.affiliateId,
        patientId: data.patientId,
        description: data.description,
        createdById: userId,
        status: 'SUBMITTED',
        policyId: null,
        amount: null,
        approvedAmount: null,
      },
      include: {
        affiliate: {
          select: { id: true, firstName: true, lastName: true },
        },
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
        client: {
          select: { id: true, name: true },
        },
      },
    })
  })

  // Log successful creation
  logger.info({ claimId: claim.id, claimNumber: claim.claimNumber, userId }, 'Claim created successfully')

  // STEP 11: Transform to DTO and Return Response
  const response: CreateClaimResponse = {
    ...claim,
    submittedDate: claim.submittedDate?.toISOString() ?? null,
    createdAt: claim.createdAt.toISOString(),
    updatedAt: claim.updatedAt.toISOString(),
  }

  return response
}

/**
 * Get available clients for claim submission
 *
 * @param userId - ID of user requesting available clients
 * @returns Array of clients user can submit claims for
 */
export async function getAvailableClients(userId: string): Promise<AvailableClientResponse[]> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name
  const allowedRoles = [
    'SUPER_ADMIN',
    'CLAIMS_EMPLOYEE',
    'OPERATIONS_EMPLOYEE',
    'ADMIN_EMPLOYEE',
    'CLIENT_ADMIN',
    'AFFILIATE',
  ]

  if (!roleName || !allowedRoles.includes(roleName)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized client list access attempt')
    throw new ForbiddenError('No tienes permiso para ver clientes')
  }

  // STEP 3: Determine Scope and Query Clients
  const isBrokerEmployee = [
    'SUPER_ADMIN',
    'CLAIMS_EMPLOYEE',
    'OPERATIONS_EMPLOYEE',
    'ADMIN_EMPLOYEE',
  ].includes(roleName)
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

    logger.info({ userId, role: roleName, count: clients.length }, 'Broker employee accessed all clients')
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

    logger.info({ userId, clientIds: accessibleClientIds, count: clients.length }, 'CLIENT_ADMIN accessed their clients')
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

    logger.info({ userId, clientId: user.affiliate.clientId, found: !!client }, 'AFFILIATE accessed their client')
  }

  return clients
}

/**
 * Get available affiliates for a specific client
 *
 * @param userId - ID of user requesting affiliates
 * @param clientId - Client to get affiliates for
 * @returns Array of owner affiliates user can select
 */
export async function getAvailableAffiliates(
  userId: string,
  clientId: string
): Promise<AvailableAffiliateResponse[]> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name
  const allowedRoles = [
    'SUPER_ADMIN',
    'CLAIMS_EMPLOYEE',
    'OPERATIONS_EMPLOYEE',
    'ADMIN_EMPLOYEE',
    'CLIENT_ADMIN',
    'AFFILIATE',
  ]

  if (!roleName || !allowedRoles.includes(roleName)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized affiliate list access attempt')
    throw new ForbiddenError('No tienes permiso para ver afiliados')
  }

  // STEP 3: Client Access Validation (same as createClaim)
  const isAffiliate = roleName === 'AFFILIATE'
  const isClientAdmin = roleName === 'CLIENT_ADMIN'

  if (isAffiliate) {
    if (clientId !== user.affiliate?.clientId) {
      logger.warn({ userId, requestedClient: clientId, userClient: user.affiliate?.clientId }, 'AFFILIATE attempted to access different client affiliates')
      throw new ForbiddenError('No puedes ver afiliados de otro cliente')
    }
  } else if (isClientAdmin) {
    const hasClientAccess = user.clientAccess.some((uc) => uc.clientId === clientId)
    if (!hasClientAccess) {
      logger.warn({ userId, requestedClient: clientId, accessibleClients: user.clientAccess.map(c => c.clientId) }, 'CLIENT_ADMIN attempted to access unauthorized client affiliates')
      throw new ForbiddenError('No tienes acceso a este cliente')
    }
  }
  // Broker employees can access any client - no check needed

  // STEP 4: Validate Client Existence and Status
  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { id: true, isActive: true },
  })

  if (!client) {
    throw new NotFoundError('Cliente no encontrado')
  }

  if (!client.isActive) {
    throw new BadRequestError('Cliente inactivo')
  }

  // STEP 5: Query Owner Affiliates for Client
  const affiliates = await db.affiliate.findMany({
    where: {
      clientId,
      affiliateType: 'OWNER',
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      coverageType: true,
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })

  logger.info({ userId, clientId, count: affiliates.length }, 'Retrieved available affiliates')

  return affiliates
}

/**
 * Get available patients for a specific affiliate
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
  const allowedRoles = [
    'SUPER_ADMIN',
    'CLAIMS_EMPLOYEE',
    'OPERATIONS_EMPLOYEE',
    'ADMIN_EMPLOYEE',
    'CLIENT_ADMIN',
    'AFFILIATE',
  ]

  if (!roleName || !allowedRoles.includes(roleName)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized patient list access attempt')
    throw new ForbiddenError('No tienes permiso para ver pacientes')
  }

  // STEP 3: Load Affiliate to Validate Access
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

  // STEP 4: Validate User Has Access to Affiliate's Client
  const isAffiliate = roleName === 'AFFILIATE'
  const isClientAdmin = roleName === 'CLIENT_ADMIN'

  if (isAffiliate) {
    if (affiliate.clientId !== user.affiliate?.clientId) {
      logger.warn({ userId, requestedAffiliateClient: affiliate.clientId, userClient: user.affiliate?.clientId }, 'AFFILIATE attempted to access different client patients')
      throw new ForbiddenError('No puedes ver pacientes de otro cliente')
    }
  } else if (isClientAdmin) {
    const hasClientAccess = user.clientAccess.some((uc) => uc.clientId === affiliate.clientId)
    if (!hasClientAccess) {
      logger.warn({ userId, requestedClient: affiliate.clientId, accessibleClients: user.clientAccess.map(c => c.clientId) }, 'CLIENT_ADMIN attempted to access unauthorized client patients')
      throw new ForbiddenError('No tienes acceso a este cliente')
    }
  }
  // Broker employees can access any affiliate - no check needed

  // STEP 5: Query Patients (Affiliate + Dependents)
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

  // STEP 6: Map to Include Relationship
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

  logger.info({ userId, affiliateId, count: patientsWithRelationship.length }, 'Retrieved available patients')

  return patientsWithRelationship
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with all context needed for claim authorization
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
