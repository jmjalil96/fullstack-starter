/**
 * addClaimInvoice.service.ts
 * Service for adding invoices to claims
 *
 * Key policies:
 * - Only SENIOR_CLAIM_MANAGERS can add invoices
 * - Can only add invoices to claims in editable states (not terminal)
 * - Invoice is linked to the claim and logged in audit trail
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

import type { AddClaimInvoiceRequest, AddClaimInvoiceResponse } from './addClaimInvoice.dto.js'

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
 * Add an invoice to a claim
 *
 * Authorization:
 * - Only SENIOR_CLAIM_MANAGERS (SUPER_ADMIN, CLAIMS_EMPLOYEE) can add invoices
 *
 * Validation:
 * - Claim must exist
 * - Claim must not be in a terminal state
 *
 * @param userId - ID of the requesting user
 * @param claimId - ID of the claim to add invoice to
 * @param data - Invoice data
 * @returns Created invoice
 */
export async function addClaimInvoice(
  userId: string,
  claimId: string,
  data: AddClaimInvoiceRequest
): Promise<AddClaimInvoiceResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  const roleName = user.globalRole?.name

  // STEP 2: Role Authorization
  if (!roleName || !SENIOR_CLAIM_MANAGERS.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized add invoice attempt')
    throw new ForbiddenError('No tienes permiso para agregar facturas a reclamos')
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
      'Attempted to add invoice to terminal claim'
    )
    throw new ForbiddenError(`No se pueden agregar facturas a reclamos en estado ${claim.status}`)
  }

  // STEP 5: Create Invoice (atomic with audit log)
  const invoice = await db.$transaction(async (tx) => {
    const created = await tx.claimInvoice.create({
      data: {
        claimId,
        invoiceNumber: data.invoiceNumber,
        providerName: data.providerName,
        amountSubmitted: data.amountSubmitted,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { name: true },
        },
      },
    })

    // Create audit log
    await tx.auditLog.create({
      data: {
        action: 'CLAIM_INVOICE_ADDED',
        resourceType: 'ClaimInvoice',
        resourceId: created.id,
        userId,
        clientId: claim.clientId,
        changes: {
          claimId,
          invoice: {
            invoiceNumber: data.invoiceNumber,
            providerName: data.providerName,
            amountSubmitted: data.amountSubmitted,
          },
        },
        metadata: {
          role: roleName,
          claimStatus: claim.status,
        },
      },
    })

    return created
  })

  logger.info(
    { userId, claimId, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber },
    'Invoice added to claim'
  )

  // STEP 6: Return Response
  return {
    id: invoice.id,
    claimId: invoice.claimId,
    invoiceNumber: invoice.invoiceNumber,
    providerName: invoice.providerName,
    amountSubmitted: invoice.amountSubmitted,
    createdById: invoice.createdById,
    createdByName: invoice.createdBy.name ?? 'Unknown',
    createdAt: invoice.createdAt.toISOString(),
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
