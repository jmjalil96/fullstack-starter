/**
 * createInvoice.service.ts
 * Service for creating new invoices with validation and authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { InvoiceStatus, PaymentStatus, Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { CreateInvoiceResponse } from './createInvoice.dto.js'
import type { CreateInvoiceInput } from './createInvoice.schema.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// User context type (returned from getUserWithContext)
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Create a new invoice
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE) can create invoices
 * - CLIENT_ADMIN and AFFILIATE cannot create invoices
 *
 * Validation:
 * - invoiceNumber must be unique (enforced by database constraint + race condition handling)
 * - Client and Insurer must exist and be active
 * - If policyIds provided, all policies must belong to the specified insurer
 * - All required fields validated by Zod schema
 * - Dates validated by Zod schema (dueDate >= issueDate if provided)
 *
 * @param userId - ID of user creating the invoice
 * @param data - Invoice data from request (validated and parsed by Zod, dates are Date objects)
 * @returns Created invoice
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role not allowed
 * @throws {NotFoundError} If client, insurer, or policy not found
 * @throws {BadRequestError} If client/insurer inactive or policy insurer mismatch
 * @throws {ConflictError} If invoiceNumber already exists (pre-check or race condition)
 */
export async function createInvoice(
  userId: string,
  data: CreateInvoiceInput
): Promise<CreateInvoiceResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (only broker employees)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized invoice creation attempt')
    throw new ForbiddenError('No tienes permiso para crear facturas')
  }

  // STEP 3: Check invoiceNumber Uniqueness (pre-check to fail fast)
  const existingInvoice = await db.invoice.findUnique({
    where: { invoiceNumber: data.invoiceNumber },
    select: { id: true, invoiceNumber: true },
  })

  if (existingInvoice) {
    logger.warn(
      { userId, invoiceNumber: data.invoiceNumber, existingInvoiceId: existingInvoice.id },
      'Attempted to create invoice with duplicate invoiceNumber'
    )
    throw new ConflictError(`Ya existe una factura con el número ${data.invoiceNumber}`)
  }

  // STEP 4: Validate Client & Insurer Exist and Are Active
  const [client, insurer] = await Promise.all([
    db.client.findUnique({
      where: { id: data.clientId },
      select: { id: true, name: true, isActive: true },
    }),
    db.insurer.findUnique({
      where: { id: data.insurerId },
      select: { id: true, name: true, isActive: true },
    }),
  ])

  if (!client) {
    throw new NotFoundError('Cliente no encontrado')
  }

  if (!client.isActive) {
    throw new BadRequestError('Cliente inactivo')
  }

  if (!insurer) {
    throw new NotFoundError('Aseguradora no encontrada')
  }

  if (!insurer.isActive) {
    throw new BadRequestError('Aseguradora inactiva')
  }

  // STEP 5: Validate Policy-Insurer Match (if policyIds provided)
  if (data.policyIds && data.policyIds.length > 0) {
    await validatePolicyInsurerMatch(data.policyIds, data.insurerId, insurer.name)
  }

  // STEP 6: Create Invoice (with race condition handling)
  let invoice
  try {
    invoice = await db.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        insurerInvoiceNumber: data.insurerInvoiceNumber,
        clientId: data.clientId,
        insurerId: data.insurerId,
        status: InvoiceStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING_PAYMENT,
        billingPeriod: data.billingPeriod,
        totalAmount: data.totalAmount,
        taxAmount: data.taxAmount ?? null,
        actualAffiliateCount: data.actualAffiliateCount,
        // Validation fields - will be calculated later in edit/validation
        expectedAmount: null,
        expectedAffiliateCount: null,
        countMatches: null,
        amountMatches: null,
        discrepancyNotes: null,
        issueDate: data.issueDate,
        dueDate: data.dueDate ?? null,
        paymentDate: null,
        uploadedById: userId,
      },
      include: {
        client: {
          select: { name: true },
        },
        insurer: {
          select: { name: true },
        },
      },
    })
  } catch (err) {
    // Handle race condition: another request created invoice with same invoiceNumber
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        const target = err.meta?.target as string[] | undefined
        if (target && target.includes('invoiceNumber')) {
          logger.warn(
            { userId, invoiceNumber: data.invoiceNumber, error: err.code },
            'Race condition: duplicate invoiceNumber detected at database level'
          )
          throw new ConflictError(`Ya existe una factura con el número ${data.invoiceNumber}`)
        }
      }
    }
    // Re-throw unexpected errors
    throw err
  }

  // STEP 7: Create InvoicePolicy Records (if policyIds provided)
  if (data.policyIds && data.policyIds.length > 0) {
    await Promise.all(
      data.policyIds.map((policyId) =>
        db.invoicePolicy.create({
          data: {
            invoiceId: invoice.id,
            policyId,
            // Placeholder values - will be calculated in edit/validation
            expectedAmount: 0,
            expectedBreakdown: {},
            expectedAffiliateCount: 0,
          },
        })
      )
    )
  }

  // STEP 8: Log Activity
  logger.info(
    {
      userId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientId: invoice.clientId,
      insurerId: invoice.insurerId,
      policyCount: data.policyIds?.length ?? 0,
    },
    'Invoice created'
  )

  // STEP 9: Transform to Response DTO
  const response: CreateInvoiceResponse = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    insurerInvoiceNumber: invoice.insurerInvoiceNumber,
    status: invoice.status as CreateInvoiceResponse['status'],
    paymentStatus: invoice.paymentStatus as CreateInvoiceResponse['paymentStatus'],
    clientId: invoice.clientId,
    clientName: invoice.client.name,
    insurerId: invoice.insurerId,
    insurerName: invoice.insurer.name,
    billingPeriod: invoice.billingPeriod,
    totalAmount: invoice.totalAmount,
    taxAmount: invoice.taxAmount,
    actualAffiliateCount: invoice.actualAffiliateCount,
    expectedAmount: invoice.expectedAmount,
    expectedAffiliateCount: invoice.expectedAffiliateCount,
    countMatches: invoice.countMatches,
    amountMatches: invoice.amountMatches,
    discrepancyNotes: invoice.discrepancyNotes,
    issueDate: invoice.issueDate.toISOString().split('T')[0],
    dueDate: invoice.dueDate?.toISOString().split('T')[0] ?? null,
    paymentDate: invoice.paymentDate?.toISOString().split('T')[0] ?? null,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  }

  return response
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

/**
 * Validate that all provided policies belong to the specified insurer
 *
 * @param policyIds - Array of policy IDs to validate
 * @param insurerId - Expected insurer ID
 * @param insurerName - Insurer name for error messages
 * @throws {NotFoundError} If any policy not found
 * @throws {BadRequestError} If any policy belongs to different insurer
 */
async function validatePolicyInsurerMatch(
  policyIds: string[],
  insurerId: string,
  insurerName: string
): Promise<void> {
  const policies = await db.policy.findMany({
    where: { id: { in: policyIds } },
    select: {
      id: true,
      policyNumber: true,
      insurerId: true,
      insurer: {
        select: { name: true },
      },
    },
  })

  // Check all policies were found
  if (policies.length !== policyIds.length) {
    const foundIds = policies.map((p) => p.id)
    const missingIds = policyIds.filter((id) => !foundIds.includes(id))
    throw new NotFoundError(`Póliza${missingIds.length > 1 ? 's' : ''} no encontrada${missingIds.length > 1 ? 's' : ''}: ${missingIds.join(', ')}`)
  }

  // Check all policies belong to the specified insurer
  const mismatchedPolicies = policies.filter((p) => p.insurerId !== insurerId)

  if (mismatchedPolicies.length > 0) {
    const firstMismatch = mismatchedPolicies[0]
    if (!firstMismatch) {
      throw new BadRequestError('Error validando pólizas')
    }
    throw new BadRequestError(
      `La póliza ${firstMismatch.policyNumber} pertenece a ${firstMismatch.insurer.name}, no a ${insurerName}`
    )
  }
}
