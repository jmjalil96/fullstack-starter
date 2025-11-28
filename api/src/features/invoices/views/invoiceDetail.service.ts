/**
 * invoiceDetail.service.ts
 * Service for fetching a single invoice detail with role-based authorization
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

import type { InvoiceDetailResponse } from './invoiceDetail.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type
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
 * Get complete invoice detail by ID with role-based authorization
 *
 * Role-based access:
 * - BROKER_EMPLOYEES: Can view any invoice
 * - CLIENT_ADMIN: Can view invoices from accessible clients only
 * - AFFILIATE: Cannot access (403 Forbidden)
 *
 * Security:
 * - Returns 404 if invoice does not exist OR user lacks access (avoids info disclosure)
 *
 * @param userId - ID of the requesting user
 * @param invoiceId - ID of the invoice to fetch (CUID)
 * @returns InvoiceDetailResponse (complete invoice with all fields + policies)
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role is not permitted
 * @throws {NotFoundError} If invoice not found or user lacks access
 */
export async function getInvoiceById(
  userId: string,
  invoiceId: string
): Promise<InvoiceDetailResponse> {
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
    logger.warn({ userId, role: roleName }, 'Unauthorized invoice detail access attempt')
    throw new ForbiddenError('No tienes permiso para ver facturas')
  }

  // STEP 3: Query Invoice with Relations
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      paymentStatus: true,
      billingPeriod: true,
      totalAmount: true,
      taxAmount: true,
      expectedAffiliateCount: true,
      actualAffiliateCount: true,
      countMatches: true,
      expectedAmount: true,
      amountMatches: true,
      discrepancyNotes: true,
      issueDate: true,
      dueDate: true,
      paymentDate: true,
      createdAt: true,
      updatedAt: true,
      clientId: true,
      insurerId: true,
      client: {
        select: { name: true },
      },
      insurer: {
        select: { name: true },
      },
      policies: {
        select: {
          policyId: true,
          expectedAmount: true,
          expectedBreakdown: true,
          expectedAffiliateCount: true,
          addedAt: true,
          policy: {
            select: { policyNumber: true },
          },
        },
        orderBy: { addedAt: 'asc' },
      },
    },
  })

  // STEP 4: Validate Invoice Exists
  if (!invoice) {
    logger.warn({ userId, invoiceId }, 'Invoice not found')
    throw new NotFoundError('Factura no encontrada')
  }

  // STEP 5: Role-Based Access Validation
  if (isClientAdmin) {
    // CLIENT_ADMIN: Can only view invoices from accessible clients
    const hasAccess = user.clientAccess.some((uc) => uc.clientId === invoice.clientId)
    if (!hasAccess) {
      logger.warn(
        {
          userId,
          invoiceId,
          invoiceClientId: invoice.clientId,
          accessibleClients: user.clientAccess.map((c) => c.clientId),
        },
        'CLIENT_ADMIN attempted unauthorized invoice access'
      )
      throw new NotFoundError('Factura no encontrada') // 404, not 403 (security)
    }
  }
  // BROKER_EMPLOYEES: No validation needed (full access)

  // STEP 6: Transform to Response DTO
  const response: InvoiceDetailResponse = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status as InvoiceDetailResponse['status'],
    paymentStatus: invoice.paymentStatus as InvoiceDetailResponse['paymentStatus'],
    billingPeriod: invoice.billingPeriod,
    totalAmount: invoice.totalAmount,
    taxAmount: invoice.taxAmount,
    expectedAffiliateCount: invoice.expectedAffiliateCount,
    actualAffiliateCount: invoice.actualAffiliateCount,
    countMatches: invoice.countMatches,
    expectedAmount: invoice.expectedAmount,
    amountMatches: invoice.amountMatches,
    discrepancyNotes: invoice.discrepancyNotes,
    issueDate: invoice.issueDate.toISOString().split('T')[0],
    dueDate: invoice.dueDate?.toISOString().split('T')[0] ?? null,
    paymentDate: invoice.paymentDate?.toISOString().split('T')[0] ?? null,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
    clientId: invoice.clientId,
    clientName: invoice.client.name,
    insurerId: invoice.insurerId,
    insurerName: invoice.insurer.name,
    policies: invoice.policies.map((ip) => ({
      policyId: ip.policyId,
      policyNumber: ip.policy.policyNumber,
      expectedAmount: ip.expectedAmount,
      expectedBreakdown: ip.expectedBreakdown as Record<string, unknown>,
      expectedAffiliateCount: ip.expectedAffiliateCount,
      addedAt: ip.addedAt.toISOString(),
    })),
  }

  // STEP 7: Log Activity
  logger.info(
    { userId, role: roleName, invoiceId, invoiceNumber: invoice.invoiceNumber },
    'Invoice detail retrieved'
  )

  // STEP 8: Return Response
  return response
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with all context needed for authorization
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
