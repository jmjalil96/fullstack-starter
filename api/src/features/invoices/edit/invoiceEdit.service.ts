/**
 * invoiceEdit.service.ts
 * Service for updating invoices with lifecycle validation and role-based authorization
 *
 * Key policies:
 * - Only BROKER_EMPLOYEES can edit invoices (no CLIENT_ADMIN edit access)
 * - Field editability determined by CURRENT status
 * - Status transitions validated by lifecycle blueprint
 * - All updates logged in audit trail
 * - Atomic updates (invoice + audit log in single transaction)
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'
import { InvoiceLifecycleValidator } from '../shared/invoiceLifecycle.validator.js'

import type { InvoiceUpdateResponse } from './invoiceEdit.dto.js'
import type { InvoiceUpdateParsed } from './invoiceEdit.schema.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type (simplified for broker-only access)
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Update an invoice with lifecycle rules
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES can edit invoices (SUPER_ADMIN, CLAIMS_EMPLOYEE, OPERATIONS_EMPLOYEE, ADMIN_EMPLOYEE)
 * - CLIENT_ADMIN and AFFILIATE cannot edit invoices
 * - No resource-level access check needed (broker employees have full access)
 *
 * Validation layers:
 * 1. Zod schema (type, format, constraints)
 * 2. Role-based edit permission (blueprint allowedEditors)
 * 3. Field-level restrictions (blueprint editableFields for current status)
 * 4. Status transition rules (blueprint allowedTransitions)
 * 5. Transition requirements (blueprint transitionRequirements vs merged state)
 *
 * @param userId - ID of the requesting user
 * @param invoiceId - ID of the invoice to update (CUID)
 * @param updates - Parsed updates from Zod (dates are Date objects)
 * @returns Updated invoice as InvoiceDetailResponse
 * @throws {UnauthorizedError} If user not found
 * @throws {NotFoundError} If invoice not found
 * @throws {BadRequestError} If validation fails (forbidden fields, invalid transition, missing requirements)
 */
export async function updateInvoice(
  userId: string,
  invoiceId: string,
  updates: InvoiceUpdateParsed
): Promise<InvoiceUpdateResponse> {
  const validator = new InvoiceLifecycleValidator()

  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  const roleName = user.globalRole?.name

  // STEP 2: Load Current Invoice
  const current = await db.invoice.findUnique({
    where: { id: invoiceId },
  })

  if (!current) {
    logger.warn({ userId, invoiceId }, 'Invoice not found for update')
    throw new NotFoundError('Factura no encontrada')
  }

  // STEP 3: Validation Layer 2 - Role Permission Check
  if (!roleName || !validator.canUserEdit(roleName, current.status)) {
    logger.warn(
      { userId, role: roleName, invoiceId, status: current.status },
      'User role cannot edit invoice in current status'
    )
    throw new ForbiddenError(
      `No tienes permiso para editar facturas en estado ${current.status}`
    )
  }

  // STEP 4: Validation Layer 3 - Field Restrictions
  // Remove 'status' from updates temporarily (validated separately in Layer 4)
  const { status: _statusUpdate, ...updatesWithoutStatus } = updates
  const forbiddenFields = validator.forbiddenFields(updatesWithoutStatus, current.status)

  if (forbiddenFields.length > 0) {
    logger.warn(
      { userId, invoiceId, status: current.status, forbiddenFields },
      'Attempted to edit forbidden fields'
    )
    throw new BadRequestError(
      `No puedes editar estos campos en estado ${current.status}: ${forbiddenFields.join(', ')}`
    )
  }

  // STEP 5: Validation Layer 4 - Status Transition (if status is changing)
  const isTransitioning = updates.status && updates.status !== current.status

  if (isTransitioning) {
    if (!updates.status) {
      throw new BadRequestError('Estado de transición no especificado')
    }
    const canTransition = validator.canTransition(current.status, updates.status)

    if (!canTransition) {
      logger.warn(
        { userId, invoiceId, from: current.status, to: updates.status },
        'Invalid status transition attempted'
      )
      throw new BadRequestError(
        `No se puede cambiar el estado de ${current.status} a ${updates.status}`
      )
    }
  }

  // STEP 6: Validation Layer 5 - Transition Requirements (if transitioning)
  if (isTransitioning) {
    if (!updates.status) {
      throw new BadRequestError('Estado de transición no especificado')
    }
    const missing = validator.missingRequirements(current, updates, updates.status)

    if (missing.length > 0) {
      logger.warn(
        { userId, invoiceId, from: current.status, to: updates.status, missingFields: missing },
        'Transition requirements not met'
      )
      throw new BadRequestError(`Faltan campos requeridos para esta transición: ${missing.join(', ')}`)
    }
  }

  // STEP 6A: Auto-Validation & Status Determination (when transitioning to VALIDATED or DISCREPANCY)
  let countMatchesFlag: boolean | undefined
  let amountMatchesFlag: boolean | undefined
  const targetStatus = updates.status

  if (isTransitioning && (targetStatus === 'VALIDATED' || targetStatus === 'DISCREPANCY')) {
    // Merge current with updates to check all values
    const merged = { ...current, ...updates }

    // Validate expected values are populated (must run validation calculation first)
    if (merged.expectedAmount == null || merged.expectedAffiliateCount == null) {
      throw new BadRequestError('Debe calcular los montos esperados primero')
    }

    // Validate actual values are populated (defensive check)
    if (merged.totalAmount == null || merged.actualAffiliateCount == null) {
      throw new BadRequestError('Datos incompletos para validar la factura')
    }

    // Safe numeric conversion
    const expectedAmount = Number(merged.expectedAmount)
    const totalAmount = Number(merged.totalAmount)
    const expectedCount = Number(merged.expectedAffiliateCount)
    const actualCount = Number(merged.actualAffiliateCount)

    // Additional safety: check for NaN
    if (isNaN(expectedAmount) || isNaN(totalAmount) || isNaN(expectedCount) || isNaN(actualCount)) {
      throw new BadRequestError('Valores de validación inválidos')
    }

    // Run comparison (simple math)
    countMatchesFlag = expectedCount === actualCount
    amountMatchesFlag = Math.abs(expectedAmount - totalAmount) <= 1.0 // $1 tolerance for rounding

    // System determines final status (overrides user's request if needed)
    const systemDeterminedStatus = countMatchesFlag && amountMatchesFlag ? 'VALIDATED' : 'DISCREPANCY'

    // Override user's requested status with system decision
    updates.status = systemDeterminedStatus

    // Log system decision
    logger.info(
      {
        userId,
        invoiceId,
        requestedStatus: targetStatus,
        systemStatus: systemDeterminedStatus,
        countMatches: countMatchesFlag,
        amountMatches: amountMatchesFlag,
        expectedAmount,
        totalAmount,
        variance: totalAmount - expectedAmount,
      },
      'Auto-determined invoice status based on validation comparison'
    )
  }

  // STEP 7: Prepare Update Data
  const updateData: Prisma.InvoiceUpdateInput = {
    ...updates,
    // Add comparison flags if validation was run
    ...(countMatchesFlag !== undefined && { countMatches: countMatchesFlag }),
    ...(amountMatchesFlag !== undefined && { amountMatches: amountMatchesFlag }),
  }

  // STEP 8: Atomic Transaction - Update Invoice + Create Audit Log
  await db.$transaction(async (tx) => {
    // Update the invoice
    const invoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    })

    // Create audit log entry
    await tx.auditLog.create({
      data: {
        action: 'UPDATE',
        resourceType: 'Invoice',
        resourceId: invoice.id,
        userId,
        changes: {
          before: current,
          after: invoice,
        },
        metadata: {
          role: roleName,
          statusTransition: isTransitioning ? `${current.status} → ${updates.status}` : null,
        },
      },
    })

    return invoice
  })

  // STEP 9: Load Updated Invoice with Relations
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
      client: { select: { name: true } },
      insurer: { select: { name: true } },
      policies: {
        select: {
          policyId: true,
          expectedAmount: true,
          expectedBreakdown: true,
          expectedAffiliateCount: true,
          addedAt: true,
          policy: { select: { policyNumber: true } },
        },
        orderBy: { addedAt: 'asc' },
      },
    },
  })

  if (!invoice) {
    throw new NotFoundError('Factura no encontrada después de actualizar')
  }

  // STEP 10: Transform to Response DTO
  const response: InvoiceUpdateResponse = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    paymentStatus: invoice.paymentStatus,
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

  // Log activity
  logger.info(
    {
      userId,
      role: roleName,
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      fieldsUpdated: Object.keys(updates),
      statusTransition: isTransitioning ? `${current.status} → ${updates.status}` : null,
    },
    'Invoice updated'
  )

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
      globalRole: { select: { name: true } },
    },
  })
}
