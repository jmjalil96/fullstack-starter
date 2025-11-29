/**
 * editClaimInvoice.service.ts
 * Service for editing claim invoices
 *
 * Key policies:
 * - Only SENIOR_CLAIM_MANAGERS can edit invoices
 * - Can only edit invoices on claims in editable states (not terminal)
 * - Invoice must belong to the specified claim
 * - Update is logged in audit trail
 */

// ============================================================================
// IMPORTS
// ============================================================================

import type { Request } from 'express'

import { db } from '../../../config/database.js'
import { SENIOR_CLAIM_MANAGERS } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'
import { AuditService, extractAuditContext } from '../../../shared/services/audit.service.js'
import { TERMINAL_STATES } from '../shared/claimLifecycle.blueprint.js'

import type { EditClaimInvoiceRequest, EditClaimInvoiceResponse } from './editClaimInvoice.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Edit a claim invoice
 *
 * Authorization:
 * - Only SENIOR_CLAIM_MANAGERS (SUPER_ADMIN, CLAIMS_EMPLOYEE) can edit invoices
 *
 * Validation:
 * - Claim must exist
 * - Claim must not be in a terminal state
 * - Invoice must exist and belong to the claim
 *
 * @param userId - ID of the requesting user
 * @param claimId - ID of the claim
 * @param invoiceId - ID of the invoice to edit
 * @param updates - Fields to update
 * @returns Updated invoice
 */
export async function editClaimInvoice(
  req: Request,
  userId: string,
  claimId: string,
  invoiceId: string,
  updates: EditClaimInvoiceRequest
): Promise<EditClaimInvoiceResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  const roleName = user.globalRole?.name

  // STEP 2: Role Authorization
  if (!roleName || !SENIOR_CLAIM_MANAGERS.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized edit invoice attempt')
    throw new ForbiddenError('No tienes permiso para editar facturas de reclamos')
  }

  // STEP 3: Load Claim
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      status: true,
      clientId: true,
    },
  })

  if (!claim) {
    throw new NotFoundError('Reclamo no encontrado')
  }

  // STEP 4: Validate Claim Status (not terminal)
  if (TERMINAL_STATES.includes(claim.status as never)) {
    logger.warn(
      { userId, claimId, claimStatus: claim.status },
      'Attempted to edit invoice on terminal claim'
    )
    throw new ForbiddenError(`No se pueden editar facturas de reclamos en estado ${claim.status}`)
  }

  // STEP 5: Load Invoice and Verify Ownership
  const current = await db.claimInvoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      claimId: true,
      invoiceNumber: true,
      providerName: true,
      amountSubmitted: true,
      createdById: true,
      createdAt: true,
    },
  })

  if (!current) {
    throw new NotFoundError('Factura no encontrada')
  }

  if (current.claimId !== claimId) {
    logger.warn(
      { userId, claimId, invoiceId, actualClaimId: current.claimId },
      'Invoice does not belong to claim'
    )
    throw new NotFoundError('Factura no encontrada en este reclamo')
  }

  // STEP 6: Clean Data for Prisma (filter undefined values)
  const dataEntries = Object.entries(updates).filter(([, v]) => v !== undefined)
  const data: Record<string, unknown> = Object.fromEntries(dataEntries)

  // STEP 7: Update Invoice (atomic with audit log)
  const updated = await db.$transaction(async (tx) => {
    const invoice = await tx.claimInvoice.update({
      where: { id: invoiceId },
      data,
      include: {
        createdBy: {
          select: { name: true },
        },
      },
    })

    // Create audit log via centralized service (fixes bug: claimId now in changes, not just metadata)
    const ctx = extractAuditContext(req, userId, claim.clientId, roleName as string)
    await AuditService.invoiceUpdated(tx, ctx, {
      invoiceId: invoice.id,
      claimId,
      claimStatus: claim.status,
      before: {
        invoiceNumber: current.invoiceNumber,
        providerName: current.providerName,
        amountSubmitted: current.amountSubmitted,
      },
      after: {
        invoiceNumber: invoice.invoiceNumber,
        providerName: invoice.providerName,
        amountSubmitted: invoice.amountSubmitted,
      },
    })

    return invoice
  })

  logger.info(
    { userId, claimId, invoiceId, invoiceNumber: updated.invoiceNumber, updates: Object.keys(updates) },
    'Invoice updated on claim'
  )

  // STEP 8: Return Response
  return {
    id: updated.id,
    claimId: updated.claimId,
    invoiceNumber: updated.invoiceNumber,
    providerName: updated.providerName,
    amountSubmitted: updated.amountSubmitted,
    createdById: updated.createdById,
    createdByName: updated.createdBy.name ?? 'Unknown',
    createdAt: updated.createdAt.toISOString(),
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
