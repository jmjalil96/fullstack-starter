/**
 * policyAffiliates.service.ts
 * Service for viewing affiliates covered under a policy with role-based authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type {
  GetPolicyAffiliatesQueryParams,
  GetPolicyAffiliatesResponse,
  PaginationMetadata,
  PolicyAffiliateResponse,
} from './policyAffiliates.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// User context type (returned from getUserWithContext)
interface UserContext {
  id: string
  globalRole: { name: string } | null
  clientAccess: { clientId: string }[]
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Get affiliates covered under a specific policy based on user role and query filters
 *
 * Role-based scoping:
 * - BROKER_EMPLOYEES: Can view affiliates for any policy
 * - CLIENT_ADMIN: Can view affiliates for policies from accessible clients only
 * - AFFILIATE: Cannot access (403 Forbidden)
 *
 * @param userId - ID of user requesting policy affiliates
 * @param policyId - ID of policy to get affiliates for
 * @param query - Validated query parameters (search, affiliateType, isActive, page, limit)
 * @returns Paginated policy affiliates list with metadata
 */
export async function getPolicyAffiliates(
  userId: string,
  policyId: string,
  query: GetPolicyAffiliatesQueryParams
): Promise<GetPolicyAffiliatesResponse> {
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
    logger.warn({ userId, role: roleName }, 'Unauthorized policy affiliates list access attempt')
    throw new ForbiddenError('No tienes permiso para ver afiliados de pólizas')
  }

  // STEP 3: Load Policy (to get clientId for CLIENT_ADMIN validation)
  const policy = await db.policy.findUnique({
    where: { id: policyId },
    select: { id: true, clientId: true, policyNumber: true },
  })

  if (!policy) {
    logger.warn({ userId, policyId }, 'Policy not found')
    throw new NotFoundError('Póliza no encontrada')
  }

  // STEP 4: CLIENT_ADMIN Access Validation
  if (isClientAdmin) {
    const hasAccess = user.clientAccess.some((uc) => uc.clientId === policy.clientId)
    if (!hasAccess) {
      logger.warn(
        { userId, policyId, policyClientId: policy.clientId, accessibleClients: user.clientAccess.map((c) => c.clientId) },
        'CLIENT_ADMIN attempted unauthorized policy affiliates access'
      )
      throw new NotFoundError('Póliza no encontrada')
    }
  }
  // BROKER_EMPLOYEES: No additional access checks needed

  // STEP 5: Build WHERE Clause with Filters
  const where: Prisma.PolicyAffiliateWhereInput = {
    policyId: policyId,
  }

  // Apply filters via nested affiliate conditions
  const affiliateWhere: Prisma.AffiliateWhereInput = {}

  if (query.affiliateType) {
    affiliateWhere.affiliateType = query.affiliateType
  }

  if (query.isActive !== undefined) {
    affiliateWhere.isActive = query.isActive
  }

  if (query.search) {
    // Search across firstName, lastName, documentNumber (case-insensitive, partial match)
    affiliateWhere.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { documentNumber: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  // Apply affiliate filters if any exist
  if (Object.keys(affiliateWhere).length > 0) {
    where.affiliate = affiliateWhere
  }

  // STEP 6: Calculate Pagination
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const skip = (page - 1) * limit
  const take = limit

  // STEP 7: Execute Parallel Queries
  const [policyAffiliates, total] = await Promise.all([
    db.policyAffiliate.findMany({
      where,
      skip,
      take,
      orderBy: [
        { affiliate: { lastName: 'asc' } },              // Family grouping (last name)
        { affiliate: { affiliateType: 'asc' } },         // OWNER before DEPENDENT (enum order)
        { affiliate: { firstName: 'asc' } },             // Alphabetical by first name
      ],
      select: {
        addedAt: true,
        affiliate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            documentType: true,
            documentNumber: true,
            affiliateType: true,
            coverageType: true,
            primaryAffiliateId: true,
            isActive: true,
            createdAt: true,
            primaryAffiliate: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    }),
    db.policyAffiliate.count({ where }),
  ])

  // STEP 8: Transform Data to DTO
  const transformedAffiliates: PolicyAffiliateResponse[] = policyAffiliates.map((pa) => ({
    id: pa.affiliate.id,
    firstName: pa.affiliate.firstName,
    lastName: pa.affiliate.lastName,
    email: pa.affiliate.email,
    phone: pa.affiliate.phone,
    dateOfBirth: pa.affiliate.dateOfBirth?.toISOString().split('T')[0] ?? null,
    documentType: pa.affiliate.documentType,
    documentNumber: pa.affiliate.documentNumber,
    affiliateType: pa.affiliate.affiliateType as PolicyAffiliateResponse['affiliateType'],
    coverageType: pa.affiliate.coverageType as PolicyAffiliateResponse['coverageType'],
    primaryAffiliateId: pa.affiliate.primaryAffiliateId,
    primaryAffiliateFirstName: pa.affiliate.primaryAffiliate?.firstName ?? null,
    primaryAffiliateLastName: pa.affiliate.primaryAffiliate?.lastName ?? null,
    addedAt: pa.addedAt.toISOString(),
    isActive: pa.affiliate.isActive,
    createdAt: pa.affiliate.createdAt.toISOString(),
  }))

  // STEP 9: Calculate Pagination Metadata
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  const pagination: PaginationMetadata = {
    total,
    page,
    limit,
    totalPages,
    hasMore,
  }

  // STEP 10: Log Activity
  logger.info(
    {
      userId,
      role: roleName,
      policyId,
      policyNumber: policy.policyNumber,
      filters: { search: query.search, affiliateType: query.affiliateType, isActive: query.isActive },
      resultCount: transformedAffiliates.length,
      total,
      page,
    },
    'Policy affiliates retrieved'
  )

  // STEP 11: Return Response
  return {
    affiliates: transformedAffiliates,
    pagination,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with all context needed for authorization
 *
 * @param userId - User ID to load
 * @returns User with role and client access data
 */
async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      globalRole: {
        select: { name: true },
      },
      clientAccess: {
        where: { isActive: true },
        select: { clientId: true },
      },
    },
  })
}

