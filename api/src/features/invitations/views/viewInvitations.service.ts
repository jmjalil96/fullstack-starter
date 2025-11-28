/**
 * viewInvitations.service.ts
 * Service for viewing and listing invitations with role-based authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { InvitationType, Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type {
  GetInvitationsQueryParams,
  GetInvitationsResponse,
  InvitationListItemResponse,
  PaginationMetadata,
} from './viewInvitations.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** User context type (returned from getUserWithContext) */
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

/** Entity data structure for Employee/Agent invitations */
interface EntityData {
  firstName?: string
  lastName?: string
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Get invitations based on user role and query filters
 *
 * Role-based authorization:
 * - BROKER_EMPLOYEES: Can view all invitations
 * - CLIENT_ADMIN, AFFILIATE: Cannot access (403 Forbidden)
 *
 * @param userId - ID of user requesting invitations
 * @param query - Validated query parameters (status, type, search, page, limit)
 * @returns Paginated invitations list with metadata
 */
export async function getInvitations(
  userId: string,
  query: GetInvitationsQueryParams
): Promise<GetInvitationsResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (only broker employees)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized invitations list access attempt')
    throw new ForbiddenError('No tienes permiso para ver invitaciones')
  }

  // STEP 3: Build WHERE Clause
  const where: Prisma.InvitationWhereInput = {}

  // Status filter (default: PENDING)
  if (query.status) {
    where.status = query.status
  }

  // Type filter
  if (query.type) {
    where.type = query.type
  }

  // Search filter (email)
  // Note: entityData search would require raw SQL, so we only search email
  if (query.search) {
    where.email = { contains: query.search, mode: 'insensitive' }
  }

  // STEP 4: Calculate Pagination
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const skip = (page - 1) * limit
  const take = limit

  // STEP 5: Execute Parallel Queries
  const [invitations, total] = await Promise.all([
    db.invitation.findMany({
      where,
      skip,
      take,
      orderBy: [
        { createdAt: 'desc' }, // Most recent first
      ],
      select: {
        id: true,
        email: true,
        token: true,
        type: true,
        status: true,
        roleId: true,
        entityData: true,
        affiliateId: true,
        expiresAt: true,
        acceptedAt: true,
        createdAt: true,
        createdById: true,
        role: {
          select: { name: true },
        },
        createdBy: {
          select: { name: true },
        },
        affiliate: {
          select: { firstName: true, lastName: true },
        },
      },
    }),
    db.invitation.count({ where }),
  ])

  // STEP 6: Transform Data to DTO
  const transformedInvitations: InvitationListItemResponse[] = invitations.map((invitation) => {
    // Extract name based on invitation type
    let name: string | null = null

    if (invitation.type === InvitationType.AFFILIATE && invitation.affiliate) {
      name = `${invitation.affiliate.firstName} ${invitation.affiliate.lastName}`
    } else if (invitation.entityData) {
      const entityData = invitation.entityData as unknown as EntityData
      if (entityData.firstName && entityData.lastName) {
        name = `${entityData.firstName} ${entityData.lastName}`
      }
    }

    return {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      type: invitation.type,
      status: invitation.status,
      roleId: invitation.roleId,
      roleName: invitation.role.name,
      name,
      affiliateId: invitation.affiliateId,
      createdById: invitation.createdById,
      createdByName: invitation.createdBy.name,
      expiresAt: invitation.expiresAt.toISOString(),
      acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
      createdAt: invitation.createdAt.toISOString(),
    }
  })

  // STEP 7: Calculate Pagination Metadata
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  const pagination: PaginationMetadata = {
    total,
    page,
    limit,
    totalPages,
    hasMore,
  }

  // STEP 8: Log Activity
  logger.info(
    {
      userId,
      role: roleName,
      filters: { status: query.status, type: query.type, search: query.search },
      resultCount: transformedInvitations.length,
      total,
      page,
    },
    'Invitations retrieved'
  )

  // STEP 9: Return Response
  return {
    invitations: transformedInvitations,
    pagination,
  }
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
