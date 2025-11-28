/**
 * claimDetail.service.ts
 * Service for fetching a single claim detail with role-based authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { ALL_AUTHORIZED_ROLES } from '../../../shared/constants/roles.js'
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type {
  ClaimDetailResponse,
  ClaimInvoiceItem,
  ClaimReprocessItem,
} from './claimDetail.dto.js'

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
 * Get complete claim detail by ID with role-based authorization
 *
 * Role-based access:
 * - SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE: Can view any claim
 * - CLIENT_ADMIN: Can view claims where claim.clientId is in their accessible clients
 * - AFFILIATE: Can view claims where claim.affiliateId === their affiliate.id
 *
 * Security:
 * - Returns 404 if claim does not exist OR user lacks access (avoid leaking existence)
 *
 * @param userId - ID of the requesting user
 * @param claimId - ID of the claim to fetch (CUID)
 * @returns ClaimDetailResponse (flat DTO)
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role is not permitted
 * @throws {NotFoundError} If claim not found or user has no access
 */
export async function getClaimById(
  userId: string,
  claimId: string
): Promise<ClaimDetailResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !ALL_AUTHORIZED_ROLES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized claim detail access attempt')
    throw new ForbiddenError('No tienes permiso para ver reclamos')
  }

  // STEP 3: Query Claim with All Relations
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      claimSequence: true,
      claimNumber: true,
      status: true,
      description: true,
      // Diagnosis fields
      careType: true,
      diagnosisCode: true,
      diagnosisDescription: true,
      // Financial fields
      amountSubmitted: true,
      amountApproved: true,
      amountDenied: true,
      amountUnprocessed: true,
      deductibleApplied: true,
      copayApplied: true,
      // Date fields
      incidentDate: true,
      submittedDate: true,
      settlementDate: true,
      createdAt: true,
      updatedAt: true,
      // Settlement fields
      businessDays: true,
      settlementNumber: true,
      settlementNotes: true,
      // Relations
      clientId: true,
      affiliateId: true,
      patientId: true,
      policyId: true,
      createdById: true,
      updatedById: true,
      client: {
        select: { name: true },
      },
      affiliate: {
        select: { firstName: true, lastName: true },
      },
      patient: {
        select: { firstName: true, lastName: true },
      },
      policy: {
        select: { policyNumber: true },
      },
      createdBy: {
        select: { name: true },
      },
      updatedBy: {
        select: { name: true },
      },
      // Claim invoices
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          providerName: true,
          amountSubmitted: true,
          createdAt: true,
          createdBy: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      // Claim reprocesses
      reprocesses: {
        select: {
          id: true,
          reprocessDate: true,
          reprocessDescription: true,
          businessDays: true,
          createdAt: true,
          createdBy: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  // STEP 4: Validate Claim Exists
  if (!claim) {
    logger.warn({ userId, claimId }, 'Claim not found')
    throw new NotFoundError('Reclamo no encontrado')
  }

  // STEP 5: Role-Based Access Validation
  const isAffiliate = roleName === 'AFFILIATE'
  const isClientAdmin = roleName === 'CLIENT_ADMIN'

  if (isAffiliate) {
    // AFFILIATE can only view claims where they are the main affiliate
    if (claim.affiliateId !== user.affiliate?.id) {
      logger.warn(
        {
          userId,
          claimId,
          claimAffiliateId: claim.affiliateId,
          userAffiliateId: user.affiliate?.id,
        },
        "AFFILIATE attempted to access another user's claim"
      )
      throw new NotFoundError('Reclamo no encontrado')
    }
  } else if (isClientAdmin) {
    // CLIENT_ADMIN can only view claims from their accessible clients
    const hasAccess = user.clientAccess.some((uc) => uc.clientId === claim.clientId)
    if (!hasAccess) {
      logger.warn(
        {
          userId,
          claimId,
          claimClientId: claim.clientId,
          accessibleClients: user.clientAccess.map((c) => c.clientId),
        },
        'CLIENT_ADMIN attempted unauthorized claim access'
      )
      throw new NotFoundError('Reclamo no encontrado')
    }
  }
  // BROKER EMPLOYEES have access to any claim - no additional checks needed

  // STEP 6: Calculate Patient Relationship
  const patientRelationship: 'self' | 'dependent' =
    claim.patientId === claim.affiliateId ? 'self' : 'dependent'

  // STEP 7: Transform invoices to DTO
  const invoices: ClaimInvoiceItem[] = claim.invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    providerName: inv.providerName,
    amountSubmitted: inv.amountSubmitted,
    createdByName: inv.createdBy.name,
    createdAt: inv.createdAt.toISOString(),
  }))

  // STEP 8: Transform reprocesses to DTO
  const reprocesses: ClaimReprocessItem[] = claim.reprocesses.map((rp) => ({
    id: rp.id,
    reprocessDate: rp.reprocessDate.toISOString().split('T')[0],
    reprocessDescription: rp.reprocessDescription,
    businessDays: rp.businessDays,
    createdByName: rp.createdBy.name,
    createdAt: rp.createdAt.toISOString(),
  }))

  // STEP 9: Transform to Flat DTO Structure
  const response: ClaimDetailResponse = {
    id: claim.id,
    claimSequence: claim.claimSequence,
    claimNumber: claim.claimNumber,
    status: claim.status as ClaimDetailResponse['status'],
    description: claim.description,
    // Diagnosis fields
    careType: claim.careType as ClaimDetailResponse['careType'],
    diagnosisCode: claim.diagnosisCode,
    diagnosisDescription: claim.diagnosisDescription,
    // Financial fields
    amountSubmitted: claim.amountSubmitted,
    amountApproved: claim.amountApproved,
    amountDenied: claim.amountDenied,
    amountUnprocessed: claim.amountUnprocessed,
    deductibleApplied: claim.deductibleApplied,
    copayApplied: claim.copayApplied,
    // Date fields
    incidentDate: claim.incidentDate?.toISOString().split('T')[0] ?? null,
    submittedDate: claim.submittedDate?.toISOString().split('T')[0] ?? null,
    settlementDate: claim.settlementDate?.toISOString().split('T')[0] ?? null,
    createdAt: claim.createdAt.toISOString(),
    updatedAt: claim.updatedAt.toISOString(),
    // Settlement fields
    businessDays: claim.businessDays,
    settlementNumber: claim.settlementNumber,
    settlementNotes: claim.settlementNotes,
    // Related entities
    clientId: claim.clientId,
    clientName: claim.client.name,
    affiliateId: claim.affiliateId,
    affiliateFirstName: claim.affiliate.firstName,
    affiliateLastName: claim.affiliate.lastName,
    patientId: claim.patientId,
    patientFirstName: claim.patient.firstName,
    patientLastName: claim.patient.lastName,
    patientRelationship,
    policyId: claim.policyId,
    policyNumber: claim.policy?.policyNumber ?? null,
    createdById: claim.createdById,
    createdByName: claim.createdBy.name,
    updatedById: claim.updatedById,
    updatedByName: claim.updatedBy?.name ?? null,
    // Related collections
    invoices,
    reprocesses,
  }

  // STEP 10: Log Successful Access
  logger.info({ userId, claimId, role: roleName }, 'Claim detail retrieved')

  // STEP 11: Return Response
  return response
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
