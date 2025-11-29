/**
 * Centralized Audit Service
 *
 * Provides type-safe, consistent audit logging across the application.
 * All audit log creation should go through this service to ensure:
 * - Consistent data structure
 * - Type safety for actions and resource types
 * - Proper capture of context (userId, clientId, role, ipAddress, userAgent)
 */

import type { Prisma } from '@prisma/client'
import type { Request } from 'express'

import { db } from '../../config/database.js'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Transaction client type
 * Extracted from Prisma's $transaction callback parameter
 */
type TransactionClient = Parameters<Parameters<typeof db.$transaction>[0]>[0]

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Resource types that can be audited
 */
export const AUDIT_RESOURCE_TYPES = {
  CLAIM: 'Claim',
  CLAIM_INVOICE: 'ClaimInvoice',
  CLAIM_FILE: 'ClaimFile',
} as const

export type AuditResourceType = (typeof AUDIT_RESOURCE_TYPES)[keyof typeof AUDIT_RESOURCE_TYPES]

/**
 * All audit actions with type safety
 */
export const AUDIT_ACTIONS = {
  // Claim actions
  CLAIM_CREATED: 'CLAIM_CREATED',
  CLAIM_UPDATED: 'CLAIM_UPDATED',
  // Invoice actions
  CLAIM_INVOICE_ADDED: 'CLAIM_INVOICE_ADDED',
  CLAIM_INVOICE_UPDATED: 'CLAIM_INVOICE_UPDATED',
  CLAIM_INVOICE_REMOVED: 'CLAIM_INVOICE_REMOVED',
  // File actions (future)
  CLAIM_FILE_ATTACHED: 'CLAIM_FILE_ATTACHED',
  CLAIM_FILE_DELETED: 'CLAIM_FILE_DELETED',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

/**
 * Spanish labels for display (used by audit-logs reader service)
 */
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CLAIM_CREATED: 'Reclamo creado',
  CLAIM_UPDATED: 'Reclamo actualizado',
  CLAIM_INVOICE_ADDED: 'Factura agregada',
  CLAIM_INVOICE_UPDATED: 'Factura actualizada',
  CLAIM_INVOICE_REMOVED: 'Factura eliminada',
  CLAIM_FILE_ATTACHED: 'Archivo adjuntado',
  CLAIM_FILE_DELETED: 'Archivo eliminado',
}

// ============================================================================
// CONTEXT
// ============================================================================

/**
 * Context available at route level for audit logging
 */
export interface AuditContext {
  userId: string
  clientId: string
  role: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Extract audit context from Express request
 *
 * @param req - Express Request object
 * @param userId - User ID performing the action
 * @param clientId - Client context for the action
 * @param role - User's role name
 * @returns AuditContext object
 *
 * @example
 * const ctx = extractAuditContext(req, user.id, claim.clientId, roleName)
 */
export function extractAuditContext(
  req: Request,
  userId: string,
  clientId: string,
  role: string
): AuditContext {
  return {
    userId,
    clientId,
    role,
    ipAddress: req.ip || req.socket?.remoteAddress,
    userAgent: req.get('user-agent'),
  }
}

// ============================================================================
// AUDIT SERVICE
// ============================================================================

/**
 * Centralized audit logging service
 *
 * All methods require a transaction client (`tx`) to ensure audit logs
 * are created atomically with the operations they record.
 *
 * @example
 * await db.$transaction(async (tx) => {
 *   // Perform operation
 *   await tx.claim.update(...)
 *
 *   // Log the operation
 *   await AuditService.claimUpdated(tx, ctx, { claimId, before, after })
 * })
 */
export const AuditService = {
  /**
   * Log claim creation
   */
  async claimCreated(
    tx: TransactionClient,
    ctx: AuditContext,
    data: {
      claimId: string
      claimNumber: string
      claimData: {
        clientId: string
        affiliateId: string
        patientId: string
        description: string | null
        careType?: string | null
        amountSubmitted?: number | null
      }
      filesAttached?: number
    }
  ): Promise<void> {
    await tx.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.CLAIM_CREATED,
        resourceType: AUDIT_RESOURCE_TYPES.CLAIM,
        resourceId: data.claimId,
        userId: ctx.userId,
        clientId: ctx.clientId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        changes: {
          claimNumber: data.claimNumber,
          claimData: data.claimData,
          filesAttached: data.filesAttached ?? 0,
        },
        metadata: {
          role: ctx.role,
        },
      },
    })
  },

  /**
   * Log claim update (including status transitions)
   */
  async claimUpdated(
    tx: TransactionClient,
    ctx: AuditContext,
    data: {
      claimId: string
      before: Prisma.JsonObject
      after: Prisma.JsonObject
      statusTransition?: { from: string; to: string } | null
      reprocessCreated?: boolean
    }
  ): Promise<void> {
    await tx.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.CLAIM_UPDATED,
        resourceType: AUDIT_RESOURCE_TYPES.CLAIM,
        resourceId: data.claimId,
        userId: ctx.userId,
        clientId: ctx.clientId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        changes: {
          before: data.before,
          after: data.after,
        },
        metadata: {
          role: ctx.role,
          statusTransition: data.statusTransition ?? null,
          reprocessCreated: data.reprocessCreated ?? false,
        },
      },
    })
  },

  /**
   * Log invoice added to claim
   */
  async invoiceAdded(
    tx: TransactionClient,
    ctx: AuditContext,
    data: {
      invoiceId: string
      claimId: string
      claimStatus: string
      invoice: {
        invoiceNumber: string
        providerName: string
        amountSubmitted: number
      }
    }
  ): Promise<void> {
    await tx.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.CLAIM_INVOICE_ADDED,
        resourceType: AUDIT_RESOURCE_TYPES.CLAIM_INVOICE,
        resourceId: data.invoiceId,
        userId: ctx.userId,
        clientId: ctx.clientId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        changes: {
          claimId: data.claimId,
          invoice: data.invoice,
        },
        metadata: {
          role: ctx.role,
          claimStatus: data.claimStatus,
        },
      },
    })
  },

  /**
   * Log invoice updated
   */
  async invoiceUpdated(
    tx: TransactionClient,
    ctx: AuditContext,
    data: {
      invoiceId: string
      claimId: string
      claimStatus: string
      before: { invoiceNumber: string; providerName: string; amountSubmitted: number }
      after: { invoiceNumber: string; providerName: string; amountSubmitted: number }
    }
  ): Promise<void> {
    await tx.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.CLAIM_INVOICE_UPDATED,
        resourceType: AUDIT_RESOURCE_TYPES.CLAIM_INVOICE,
        resourceId: data.invoiceId,
        userId: ctx.userId,
        clientId: ctx.clientId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        changes: {
          claimId: data.claimId,
          before: data.before,
          after: data.after,
        },
        metadata: {
          role: ctx.role,
          claimStatus: data.claimStatus,
        },
      },
    })
  },

  /**
   * Log invoice removed from claim
   */
  async invoiceRemoved(
    tx: TransactionClient,
    ctx: AuditContext,
    data: {
      invoiceId: string
      claimId: string
      claimStatus: string
      invoice: {
        invoiceNumber: string
        providerName: string
        amountSubmitted: number
      }
    }
  ): Promise<void> {
    await tx.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.CLAIM_INVOICE_REMOVED,
        resourceType: AUDIT_RESOURCE_TYPES.CLAIM_INVOICE,
        resourceId: data.invoiceId,
        userId: ctx.userId,
        clientId: ctx.clientId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        changes: {
          claimId: data.claimId,
          invoice: data.invoice,
        },
        metadata: {
          role: ctx.role,
          claimStatus: data.claimStatus,
        },
      },
    })
  },
}
