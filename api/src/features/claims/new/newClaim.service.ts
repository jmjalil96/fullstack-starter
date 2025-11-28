/**
 * newClaim.service.ts
 * Service for creating new claims with full validation and security
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { ALL_AUTHORIZED_ROLES } from '../../../shared/constants/roles.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'
import { generateClaimNumber } from '../shared/claimNumber.utils.js'

import type { CreateClaimRequest, CreateClaimResponse } from './newClaim.dto.js'

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

  if (!roleName || !ALL_AUTHORIZED_ROLES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized claim creation attempt')
    throw new ForbiddenError('No tienes permiso para crear reclamos')
  }

  // STEP 3: Client Access Validation
  const isAffiliate = roleName === 'AFFILIATE'
  const isClientAdmin = roleName === 'CLIENT_ADMIN'

  if (isAffiliate) {
    if (data.clientId !== user.affiliate?.clientId) {
      logger.warn(
        { userId, requestedClient: data.clientId, userClient: user.affiliate?.clientId },
        'Cross-client access attempt'
      )
      throw new ForbiddenError('No puedes crear reclamos para otro cliente')
    }
  } else if (isClientAdmin) {
    const hasClientAccess = user.clientAccess.some((uc) => uc.clientId === data.clientId)
    if (!hasClientAccess) {
      logger.warn(
        {
          userId,
          requestedClient: data.clientId,
          accessibleClients: user.clientAccess.map((c) => c.clientId),
        },
        'Client access denied'
      )
      throw new ForbiddenError('No tienes acceso a este cliente')
    }
  }
  // Broker employees can access any client

  // STEP 4: Affiliate Ownership Validation
  if (isAffiliate) {
    if (data.affiliateId !== user.affiliate?.id) {
      logger.warn(
        { userId, requestedAffiliate: data.affiliateId, userAffiliate: user.affiliate?.id },
        'Affiliate impersonation attempt'
      )
      throw new ForbiddenError('Solo puedes crear reclamos para ti mismo')
    }
  }

  // STEP 5: Load Affiliate and Patient Entities
  let affiliate: { id: string; clientId: string; isActive: boolean } | null
  let patient: {
    id: string
    clientId: string
    isActive: boolean
    primaryAffiliateId: string | null
  } | null

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
    logger.warn(
      {
        affiliateId: affiliate.id,
        affiliateClient: affiliate.clientId,
        requestedClient: data.clientId,
      },
      'Affiliate client mismatch'
    )
    throw new BadRequestError('Afiliado no pertenece a este cliente')
  }

  if (patient.clientId !== data.clientId) {
    logger.warn(
      { patientId: patient.id, patientClient: patient.clientId, requestedClient: data.clientId },
      'Patient client mismatch'
    )
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
    logger.warn(
      {
        affiliateId: affiliate.id,
        patientId: patient.id,
        primaryAffiliateId: patient.primaryAffiliateId,
      },
      'Invalid affiliate-patient relationship'
    )
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

    // Create claim with new fields and DRAFT status
    const createdClaim = await tx.claim.create({
      data: {
        claimSequence,
        claimNumber,
        clientId: data.clientId,
        affiliateId: data.affiliateId,
        patientId: data.patientId,
        description: data.description ?? null,
        careType: data.careType ?? null,
        diagnosisCode: data.diagnosisCode ?? null,
        diagnosisDescription: data.diagnosisDescription ?? null,
        amountSubmitted: data.amountSubmitted ?? null,
        incidentDate: data.incidentDate ? new Date(data.incidentDate) : null,
        submittedDate: data.submittedDate ? new Date(data.submittedDate) : null,
        createdById: userId,
        status: 'DRAFT', // Claims now start in DRAFT status
        policyId: null,
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

    // STEP 10: Create File records for pending files
    if (data.pendingFiles && data.pendingFiles.length > 0) {
      for (const pendingFile of data.pendingFiles) {
        // Validate storage key starts with pending/
        if (!pendingFile.storageKey.startsWith('pending/')) {
          throw new BadRequestError('Storage key inválido para archivo pendiente')
        }

        // Validate user owns this pending file
        if (!pendingFile.storageKey.startsWith(`pending/${userId}/`)) {
          logger.warn(
            { userId, storageKey: pendingFile.storageKey },
            'User attempted to claim file they do not own'
          )
          throw new ForbiddenError('No tienes permiso para este archivo')
        }

        // Create File record
        const file = await tx.file.create({
          data: {
            storageKey: pendingFile.storageKey,
            originalName: pendingFile.originalName,
            mimeType: pendingFile.mimeType,
            fileSize: pendingFile.fileSize,
            uploadedById: userId,
            entityType: 'CLAIM',
            entityId: createdClaim.id,
          },
        })

        // Create ClaimFile link with category
        await tx.claimFile.create({
          data: {
            claimId: createdClaim.id,
            fileId: file.id,
            category: pendingFile.category as
              | 'RECEIPT'
              | 'PRESCRIPTION'
              | 'LAB_REPORT'
              | 'DISCHARGE_SUMMARY'
              | 'AUTHORIZATION'
              | 'OTHER'
              | undefined,
          },
        })
      }

      logger.info(
        { claimId: createdClaim.id, fileCount: data.pendingFiles.length },
        'Pending files attached to claim'
      )
    }

    return createdClaim
  })

  // Log successful creation
  logger.info(
    { claimId: claim.id, claimNumber: claim.claimNumber, userId },
    'Claim created successfully'
  )

  // STEP 11: Transform to DTO and Return Response (flat structure)
  const response: CreateClaimResponse = {
    id: claim.id,
    claimNumber: claim.claimNumber,
    status: claim.status as CreateClaimResponse['status'],
    description: claim.description,
    careType: claim.careType as CreateClaimResponse['careType'],
    diagnosisCode: claim.diagnosisCode,
    diagnosisDescription: claim.diagnosisDescription,
    amountSubmitted: claim.amountSubmitted,
    incidentDate: claim.incidentDate?.toISOString().split('T')[0] ?? null,
    submittedDate: claim.submittedDate?.toISOString().split('T')[0] ?? null,
    clientId: claim.clientId,
    clientName: claim.client.name,
    affiliateId: claim.affiliateId,
    affiliateFirstName: claim.affiliate.firstName,
    affiliateLastName: claim.affiliate.lastName,
    patientId: claim.patientId,
    patientFirstName: claim.patient.firstName,
    patientLastName: claim.patient.lastName,
    policyId: claim.policyId,
    createdById: claim.createdById,
    createdAt: claim.createdAt.toISOString(),
    updatedAt: claim.updatedAt.toISOString(),
  }

  return response
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
