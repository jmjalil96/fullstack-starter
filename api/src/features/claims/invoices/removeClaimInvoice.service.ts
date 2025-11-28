/**
 * removeClaimInvoice.service.ts
 * Service for removing invoices from claims
 *
 * Key policies:
 * - Only SENIOR_CLAIM_MANAGERS can remove invoices
 * - Can only remove invoices from claims in editable states (not terminal)
 * - Invoice must belong to the specified claim
 * - Deletion is logged in audit trail
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { SENIOR_CLAIM_MANAGERS } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'
import { TERMINAL_STATES } from '../shared/claimLifecycle.blueprint.js'

import type { RemoveClaimInvoiceResponse } from './removeClaimInvoice.dto.js'

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
 * Remove an invoice from a claim
 *
 * Authorization:
 * - Only SENIOR_CLAIM_MANAGERS (SUPER_ADMIN, CLAIMS_EMPLOYEE) can remove invoices
 *
 * Validation:
 * - Claim must exist
 * - Claim must not be in a terminal state
 * - Invoice must exist and belong to the claim
 *
 * @param userId - ID of the requesting user
 * @param claimId - ID of the claim
 * @param invoiceId - ID of the invoice to remove
 * @returns Success response
 */
export async function removeClaimInvoice(
  userId: string,
  claimId: string,
  invoiceId: string
): Promise<RemoveClaimInvoiceResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  const roleName = user.globalRole?.name

  // STEP 2: Role Authorization
  if (!roleName || !SENIOR_CLAIM_MANAGERS.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized remove invoice attempt')
    throw new ForbiddenError('No tienes permiso para eliminar facturas de reclamos')
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
      'Attempted to remove invoice from terminal claim'
    )
    throw new ForbiddenError(`No se pueden eliminar facturas de reclamos en estado ${claim.status}`)
  }

  // STEP 5: Load Invoice and Verify Ownership
  const invoice = await db.claimInvoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      claimId: true,
      invoiceNumber: true,
      providerName: true,
      amountSubmitted: true,
    },
  })

  if (!invoice) {
    throw new NotFoundError('Factura no encontrada')
  }

  if (invoice.claimId !== claimId) {
    logger.warn(
      { userId, claimId, invoiceId, actualClaimId: invoice.claimId },
      'Invoice does not belong to claim'
    )
    throw new NotFoundError('Factura no encontrada en este reclamo')
  }

  // STEP 6: Delete Invoice (atomic with audit log)
  await db.$transaction(async (tx) => {
    await tx.claimInvoice.delete({
      where: { id: invoiceId },
    })

    // Create audit log
    await tx.auditLog.create({
      data: {
        action: 'CLAIM_INVOICE_REMOVED',
        resourceType: 'ClaimInvoice',
        resourceId: invoiceId,
        userId,
        clientId: claim.clientId,
        changes: {
          claimId,
          invoice: {
            invoiceNumber: invoice.invoiceNumber,
            providerName: invoice.providerName,
            amountSubmitted: invoice.amountSubmitted,
          },
        },
        metadata: {
          role: roleName,
          claimStatus: claim.status,
        },
      },
    })
  })

  logger.info(
    { userId, claimId, invoiceId, invoiceNumber: invoice.invoiceNumber },
    'Invoice removed from claim'
  )

  // STEP 7: Return Response
  return {
    success: true,
    message: 'Factura eliminada exitosamente',
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
