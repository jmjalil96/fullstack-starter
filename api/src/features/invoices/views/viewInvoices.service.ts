/**
 * viewInvoices.service.ts
 * Service for retrieving paginated invoice lists with role-based filtering
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import { ForbiddenError, UnauthorizedError } from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type {
  GetInvoicesQueryParams,
  GetInvoicesResponse,
  InvoiceListItemResponse,
  PaginationMetadata,
} from './viewInvoices.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context with role and client access
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
  clientAccess: { clientId: string }[]
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Get paginated list of invoices with role-based filtering
 *
 * Access Control:
 * - BROKER_EMPLOYEES: Can view all invoices (no restrictions)
 * - CLIENT_ADMIN: Can view invoices from accessible clients only (via UserClient)
 * - AFFILIATE: Forbidden (consistent with policies/affiliates pattern)
 *
 * @param userId - ID of user requesting invoices
 * @param query - Query parameters (filters + pagination)
 * @returns Paginated invoice list with metadata
 */
export async function getInvoices(
  userId: string,
  query: GetInvoicesQueryParams
): Promise<GetInvoicesResponse> {
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
    logger.warn({ userId, role: roleName }, 'Unauthorized invoices list access attempt')
    throw new ForbiddenError('No tienes permiso para ver facturas')
  }

  // STEP 3: Build Base WHERE Clause (Role-Based Scoping)
  let where: Prisma.InvoiceWhereInput = {}

  if (isClientAdmin) {
    // CLIENT_ADMIN: Only invoices from accessible clients
    const accessibleClientIds = user.clientAccess.map((uc) => uc.clientId)

    if (accessibleClientIds.length === 0) {
      logger.info({ userId }, 'CLIENT_ADMIN has no client access')
      return emptyResponse(query)
    }

    where = {
      clientId: { in: accessibleClientIds },
    }
  }
  // BROKER_EMPLOYEES: No base scoping (can see all invoices)

  // STEP 4: Apply Query Filters (with role-based validation)
  if (query.status) {
    where.status = query.status
  }

  if (query.clientId) {
    // Apply client filter with role-based validation
    if (isClientAdmin) {
      // CLIENT_ADMIN: Validate access to requested client
      const hasAccess = user.clientAccess.some((uc) => uc.clientId === query.clientId)
      if (!hasAccess) {
        logger.warn(
          {
            userId,
            requestedClient: query.clientId,
            accessibleClients: user.clientAccess.map((c) => c.clientId),
          },
          'CLIENT_ADMIN attempted unauthorized client filter'
        )
        throw new ForbiddenError('No tienes acceso a este cliente')
      }
      where.clientId = query.clientId
    } else if (isBrokerEmployee) {
      // BROKER: Apply filter directly
      where.clientId = query.clientId
    }
  }

  if (query.insurerId) {
    where.insurerId = query.insurerId
  }

  if (query.paymentStatus) {
    where.paymentStatus = query.paymentStatus
  }

  if (query.search) {
    // Search in invoice number (case-insensitive partial match)
    where.invoiceNumber = { contains: query.search, mode: 'insensitive' }
  }

  // STEP 5: Calculate Pagination
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const skip = (page - 1) * limit
  const take = limit

  // STEP 6: Execute Parallel Queries (count + data)
  const [invoices, total] = await Promise.all([
    db.invoice.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        paymentStatus: true,
        clientId: true,
        client: {
          select: { name: true },
        },
        insurerId: true,
        insurer: {
          select: { name: true },
        },
        billingPeriod: true,
        totalAmount: true,
        expectedAmount: true,
        countMatches: true,
        amountMatches: true,
        issueDate: true,
        dueDate: true,
        paymentDate: true,
        createdAt: true,
      },
    }),
    db.invoice.count({ where }),
  ])

  // STEP 7: Transform Data to DTO (flat structure)
  const transformedInvoices: InvoiceListItemResponse[] = invoices.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status as InvoiceListItemResponse['status'],
    paymentStatus: invoice.paymentStatus as InvoiceListItemResponse['paymentStatus'],
    clientId: invoice.clientId,
    clientName: invoice.client.name,
    insurerId: invoice.insurerId,
    insurerName: invoice.insurer.name,
    billingPeriod: invoice.billingPeriod,
    totalAmount: invoice.totalAmount,
    expectedAmount: invoice.expectedAmount,
    countMatches: invoice.countMatches,
    amountMatches: invoice.amountMatches,
    issueDate: invoice.issueDate.toISOString().split('T')[0],
    dueDate: invoice.dueDate?.toISOString().split('T')[0] ?? null,
    paymentDate: invoice.paymentDate?.toISOString().split('T')[0] ?? null,
    createdAt: invoice.createdAt.toISOString(),
  }))

  // STEP 8: Calculate Pagination Metadata
  const totalPages = Math.ceil(total / limit)
  const hasMore = page < totalPages

  const pagination: PaginationMetadata = {
    total,
    page,
    limit,
    totalPages,
    hasMore,
  }

  // STEP 9: Log Activity
  logger.info(
    {
      userId,
      role: roleName,
      isBrokerEmployee,
      isClientAdmin,
      accessibleClients: isClientAdmin ? user.clientAccess.map((c) => c.clientId) : undefined,
      filters: {
        status: query.status,
        paymentStatus: query.paymentStatus,
        clientId: query.clientId,
        insurerId: query.insurerId,
        search: query.search,
      },
      resultCount: transformedInvoices.length,
      total,
      page,
    },
    'Invoices retrieved'
  )

  // STEP 10: Return Response
  return {
    invoices: transformedInvoices,
    pagination,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with role and client access context
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

/**
 * Return empty response with pagination metadata
 * Used when user has no access to any data
 *
 * @param query - Query parameters for pagination defaults
 * @returns Empty response with metadata
 */
function emptyResponse(query: GetInvoicesQueryParams): GetInvoicesResponse {
  const page = query.page ?? 1
  const limit = query.limit ?? 20

  return {
    invoices: [],
    pagination: {
      total: 0,
      page,
      limit,
      totalPages: 0,
      hasMore: false,
    },
  }
}
