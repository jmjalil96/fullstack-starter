/**
 * viewInsurers.service.ts
 * Service for viewing and listing insurers with role-based authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type {
  GetInsurersQueryParams,
  GetInsurersResponse,
  InsurerListItemResponse,
  PaginationMetadata,
} from './viewInsurers.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type (returned from getUserWithContext)
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Get insurers based on filters
 *
 * Role-based authorization:
 * - BROKER_EMPLOYEES only: Can view all insurers
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden (admin feature)
 *
 * @param userId - ID of user requesting insurers
 * @param query - Validated query parameters (search, isActive, page, limit)
 * @returns Paginated insurers list with metadata
 */
export async function getInsurers(
  userId: string,
  query: GetInsurersQueryParams
): Promise<GetInsurersResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (BROKER_EMPLOYEES only)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized insurers list access attempt')
    throw new ForbiddenError('No tienes permiso para ver aseguradoras')
  }

  // STEP 3: Build WHERE Clause with Filters
  const where: Prisma.InsurerWhereInput = {}

  if (query.search) {
    // Search by name or code (case-insensitive, contains match)
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { code: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive
  }

  // STEP 4: Calculate Pagination
  const page = query.page ?? 1
  const limit = query.limit ?? 10
  const skip = (page - 1) * limit
  const take = limit

  // STEP 5: Execute Parallel Queries
  const [insurers, total] = await Promise.all([
    db.insurer.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' }, // Alphabetical order
      select: {
        id: true,
        name: true,
        code: true,
        email: true,
        phone: true,
        billingCutoffDay: true,
        isActive: true,
      },
    }),
    db.insurer.count({ where }),
  ])

  // STEP 6: Transform Data to DTO
  const transformedInsurers: InsurerListItemResponse[] = insurers.map((insurer) => ({
    id: insurer.id,
    name: insurer.name,
    code: insurer.code,
    email: insurer.email,
    phone: insurer.phone,
    billingCutoffDay: insurer.billingCutoffDay,
    isActive: insurer.isActive,
  }))

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
      filters: { search: query.search, isActive: query.isActive },
      resultCount: transformedInsurers.length,
      total,
      page,
    },
    'Insurers retrieved'
  )

  // STEP 9: Return Response
  return {
    insurers: transformedInsurers,
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
