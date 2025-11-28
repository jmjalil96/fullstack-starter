/**
 * claimFiles.service.ts
 * Service for listing files attached to a claim
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

import type { ClaimFilesResponse } from './claimFiles.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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
 * Get all files attached to a claim
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can view any claim's files
 * - CLIENT_ADMIN: Can view files from own client's claims
 * - AFFILIATE: Can view files from own claims only
 *
 * @param userId - ID of the requesting user
 * @param claimId - ID of the claim
 * @returns List of files
 */
export async function getClaimFiles(
  userId: string,
  claimId: string
): Promise<ClaimFilesResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Load claim with affiliate info for authorization
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      affiliateId: true,
      affiliate: {
        select: { clientId: true },
      },
    },
  })

  if (!claim) {
    throw new NotFoundError('Reclamo no encontrado')
  }

  // STEP 3: Authorization check
  const roleName = user.globalRole?.name
  const isBrokerEmployee = roleName ? BROKER_EMPLOYEES.includes(roleName as never) : false
  const isClientAdmin = roleName === 'CLIENT_ADMIN'
  const isAffiliate = roleName === 'AFFILIATE'

  if (!isBrokerEmployee) {
    if (isClientAdmin) {
      const hasAccess = user.clientAccess.some((uc) => uc.clientId === claim.affiliate.clientId)
      if (!hasAccess) {
        throw new NotFoundError('Reclamo no encontrado')
      }
    } else if (isAffiliate) {
      if (claim.affiliateId !== user.affiliate?.id) {
        throw new NotFoundError('Reclamo no encontrado')
      }
    } else {
      throw new ForbiddenError('No tienes permiso para ver archivos de reclamos')
    }
  }

  // STEP 4: Query files
  const claimFiles = await db.claimFile.findMany({
    where: {
      claimId,
      file: {
        deletedAt: null,
      },
    },
    select: {
      category: true,
      description: true,
      file: {
        select: {
          id: true,
          originalName: true,
          fileSize: true,
          mimeType: true,
          uploadedAt: true,
          uploadedBy: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // STEP 5: Log activity
  logger.info(
    { userId, claimId, fileCount: claimFiles.length },
    'Claim files retrieved'
  )

  // STEP 6: Transform to response
  return {
    files: claimFiles.map((cf) => ({
      id: cf.file.id,
      originalName: cf.file.originalName,
      fileSize: cf.file.fileSize.toString(),
      mimeType: cf.file.mimeType,
      category: cf.category,
      description: cf.description,
      uploadedByName: cf.file.uploadedBy.name ?? 'Unknown',
      uploadedAt: cf.file.uploadedAt.toISOString(),
    })),
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with all context needed for authorization
 */
async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      globalRole: { select: { name: true } },
      affiliate: { select: { id: true, clientId: true } },
      clientAccess: {
        where: { isActive: true },
        select: { clientId: true },
      },
    },
  })
}
