/**
 * auditLogs.service.ts
 * Service for fetching claim audit logs with role-based authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import type { Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import { ALL_AUTHORIZED_ROLES } from '../../../shared/constants/roles.js'
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'
import { AUDIT_ACTION_LABELS } from '../../../shared/services/audit.service.js'

import type { AuditLogChange, AuditLogItem, GetAuditLogsResponse } from './auditLogs.dto.js'
import type { AuditLogsQuery } from './auditLogs.schema.js'

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Spanish labels for claim fields
 * (Matches frontend FIELD_LABELS from claimLifecycle.ts)
 */
const FIELD_LABELS: Record<string, string> = {
  status: 'Estado',
  description: 'Descripción',
  careType: 'Tipo de Atención',
  diagnosisCode: 'Código Diagnóstico',
  diagnosisDescription: 'Descripción Diagnóstico',
  amountSubmitted: 'Monto Presentado',
  amountApproved: 'Monto Aprobado',
  amountDenied: 'Gastos No Elegibles',
  amountUnprocessed: 'Gastos No Procesados',
  deductibleApplied: 'Deducible Aplicado',
  copayApplied: 'Copago',
  incidentDate: 'Fecha de Incurrencia',
  submittedDate: 'Fecha de Presentación',
  settlementDate: 'Fecha de Liquidación',
  settlementNumber: 'Número de Liquidación',
  settlementNotes: 'Observaciones',
  businessDays: 'Días Laborables',
  policyId: 'Póliza',
  invoiceNumber: 'Número de Factura',
  providerName: 'Proveedor',
  claimNumber: 'Número de Reclamo',
  filesAttached: 'Archivos Adjuntos',
}

/**
 * Spanish labels for status values
 */
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  VALIDATION: 'Validación',
  SUBMITTED: 'Tramitado',
  PENDING_INFO: 'Pendiente Info',
  RETURNED: 'Devuelto',
  SETTLED: 'Liquidado',
  CANCELLED: 'Cancelado',
}

/**
 * Spanish labels for care type values
 */
const CARE_TYPE_LABELS: Record<string, string> = {
  AMBULATORY: 'Ambulatorio',
  HOSPITALIZATION: 'Hospitalización',
  MATERNITY: 'Maternidad',
  EMERGENCY: 'Emergencia',
  OTHER: 'Otro',
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserContext {
  id: string
  globalRole: { name: string } | null
  affiliate: { id: string; clientId: string } | null
  clientAccess: { clientId: string }[]
}

interface RawAuditLog {
  id: string
  action: string
  resourceType: string
  resourceId: string
  changes: Prisma.JsonValue
  metadata: Prisma.JsonValue
  createdAt: Date
  user: { name: string | null } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Get audit logs for a claim with role-based authorization
 *
 * Queries audit logs where:
 * - resourceType = 'Claim' AND resourceId = claimId
 * - OR resourceType = 'ClaimInvoice' AND changes.claimId = claimId
 *
 * @param userId - ID of the requesting user
 * @param claimId - ID of the claim
 * @param query - Pagination parameters
 * @returns Paginated audit log items
 */
export async function getClaimAuditLogs(
  userId: string,
  claimId: string,
  query: AuditLogsQuery
): Promise<GetAuditLogsResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !ALL_AUTHORIZED_ROLES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized audit logs access attempt')
    throw new ForbiddenError('No tienes permiso para ver auditorías de reclamos')
  }

  // STEP 3: Load Claim (minimal fields for access check)
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      clientId: true,
      affiliateId: true,
    },
  })

  // STEP 4: Validate Claim Exists
  if (!claim) {
    logger.warn({ userId, claimId }, 'Claim not found for audit logs')
    throw new NotFoundError('Reclamo no encontrado')
  }

  // STEP 5: Role-Based Access Validation
  const isAffiliate = roleName === 'AFFILIATE'
  const isClientAdmin = roleName === 'CLIENT_ADMIN'

  if (isAffiliate) {
    if (claim.affiliateId !== user.affiliate?.id) {
      logger.warn(
        { userId, claimId, claimAffiliateId: claim.affiliateId, userAffiliateId: user.affiliate?.id },
        'AFFILIATE attempted to access audit logs for another claim'
      )
      throw new NotFoundError('Reclamo no encontrado')
    }
  } else if (isClientAdmin) {
    const hasAccess = user.clientAccess.some((uc) => uc.clientId === claim.clientId)
    if (!hasAccess) {
      logger.warn(
        { userId, claimId, claimClientId: claim.clientId },
        'CLIENT_ADMIN attempted unauthorized audit logs access'
      )
      throw new NotFoundError('Reclamo no encontrado')
    }
  }

  // STEP 6: Build Where Clause (Claim + ClaimInvoice logs)
  const where: Prisma.AuditLogWhereInput = {
    OR: [
      { resourceType: 'Claim', resourceId: claimId },
      {
        resourceType: 'ClaimInvoice',
        changes: { path: ['claimId'], equals: claimId },
      },
    ],
  }

  // STEP 7: Query Audit Logs with Pagination
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        changes: true,
        metadata: true,
        createdAt: true,
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: (query.page - 1) * query.limit,
    }),
    db.auditLog.count({ where }),
  ])

  // STEP 8: Transform to DTOs
  const items: AuditLogItem[] = logs.map((log) => transformAuditLog(log))

  // STEP 9: Calculate Pagination Metadata
  const totalPages = Math.ceil(total / query.limit)
  const response: GetAuditLogsResponse = {
    items,
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages,
      hasMore: query.page < totalPages,
    },
  }

  // STEP 10: Log Successful Access
  logger.info({ userId, claimId, role: roleName, count: items.length }, 'Audit logs retrieved')

  // STEP 11: Return Response
  return response
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with role and access context
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

/**
 * Transform raw audit log to DTO
 */
function transformAuditLog(log: RawAuditLog): AuditLogItem {
  const changes = extractChanges(log.action, log.changes as Record<string, unknown> | null)

  return {
    id: log.id,
    action: log.action,
    actionLabel: AUDIT_ACTION_LABELS[log.action as keyof typeof AUDIT_ACTION_LABELS] ?? log.action,
    userName: log.user?.name ?? null,
    changes,
    metadata: log.metadata as Record<string, unknown> | null,
    createdAt: log.createdAt.toISOString(),
  }
}

/**
 * Extract human-readable changes from audit log JSON
 */
function extractChanges(
  action: string,
  changes: Record<string, unknown> | null
): AuditLogChange[] {
  if (!changes) return []

  // For CLAIM_UPDATED: compare before/after
  if (action === 'CLAIM_UPDATED') {
    const before = changes.before as Record<string, unknown> | undefined
    const after = changes.after as Record<string, unknown> | undefined

    if (before && after) {
      return diffObjects(before, after)
    }
  }

  // For CLAIM_INVOICE_ADDED: show invoice details
  if (action === 'CLAIM_INVOICE_ADDED') {
    const invoice = changes.invoice as Record<string, unknown> | undefined
    if (invoice) {
      return [
        {
          field: 'invoice',
          fieldLabel: 'Factura',
          oldValue: null,
          newValue: formatInvoice(invoice),
        },
      ]
    }
  }

  // For CLAIM_INVOICE_UPDATED: compare before/after
  if (action === 'CLAIM_INVOICE_UPDATED') {
    const before = changes.before as Record<string, unknown> | undefined
    const after = changes.after as Record<string, unknown> | undefined

    if (before && after) {
      return diffObjects(before, after)
    }
  }

  // For CLAIM_INVOICE_REMOVED: show removed invoice
  if (action === 'CLAIM_INVOICE_REMOVED') {
    const invoice = changes.invoice as Record<string, unknown> | undefined
    if (invoice) {
      return [
        {
          field: 'invoice',
          fieldLabel: 'Factura',
          oldValue: formatInvoice(invoice),
          newValue: null,
        },
      ]
    }
  }

  // For CLAIM_CREATED: show creation details
  if (action === 'CLAIM_CREATED') {
    const claimNumber = changes.claimNumber as string | undefined
    const claimData = changes.claimData as Record<string, unknown> | undefined
    const filesAttached = changes.filesAttached as number | undefined

    const result: AuditLogChange[] = []

    if (claimNumber) {
      result.push({
        field: 'claimNumber',
        fieldLabel: 'Número de Reclamo',
        oldValue: null,
        newValue: claimNumber,
      })
    }

    if (claimData?.description) {
      result.push({
        field: 'description',
        fieldLabel: 'Descripción',
        oldValue: null,
        newValue: String(claimData.description),
      })
    }

    if (claimData?.careType) {
      result.push({
        field: 'careType',
        fieldLabel: 'Tipo de Atención',
        oldValue: null,
        newValue: CARE_TYPE_LABELS[String(claimData.careType)] ?? String(claimData.careType),
      })
    }

    if (typeof filesAttached === 'number' && filesAttached > 0) {
      result.push({
        field: 'filesAttached',
        fieldLabel: 'Archivos Adjuntos',
        oldValue: null,
        newValue: `${filesAttached} archivo(s)`,
      })
    }

    return result
  }

  return []
}

/**
 * Compare two objects and return field-level changes
 */
function diffObjects(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): AuditLogChange[] {
  const changes: AuditLogChange[] = []
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

  // Fields to skip (internal/non-displayable)
  const skipFields = new Set([
    'id',
    'createdAt',
    'updatedAt',
    'createdById',
    'updatedById',
    'clientId',
    'affiliateId',
    'patientId',
    'claimSequence',
  ])

  for (const key of allKeys) {
    if (skipFields.has(key)) continue

    const oldVal = before[key]
    const newVal = after[key]

    // Skip if values are equal
    if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue

    // Skip if both are null/undefined
    if (oldVal == null && newVal == null) continue

    const fieldLabel = FIELD_LABELS[key] ?? key

    changes.push({
      field: key,
      fieldLabel,
      oldValue: formatValue(key, oldVal),
      newValue: formatValue(key, newVal),
    })
  }

  return changes
}

/**
 * Format a value for display based on field type
 */
function formatValue(field: string, value: unknown): string | null {
  if (value === null || value === undefined) return null

  // Status field: use status labels
  if (field === 'status' && typeof value === 'string') {
    return STATUS_LABELS[value] ?? value
  }

  // Care type field: use care type labels
  if (field === 'careType' && typeof value === 'string') {
    return CARE_TYPE_LABELS[value] ?? value
  }

  // Number fields: format with locale
  if (typeof value === 'number') {
    // Currency fields
    if (
      field.startsWith('amount') ||
      field === 'deductibleApplied' ||
      field === 'copayApplied'
    ) {
      return value.toLocaleString('es-PA', {
        style: 'currency',
        currency: 'USD',
      })
    }
    return value.toLocaleString('es-PA')
  }

  // Date fields: format as date
  if (typeof value === 'string' && field.endsWith('Date')) {
    try {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-PA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      }
    } catch {
      // Fall through to string return
    }
  }

  // Boolean fields
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No'
  }

  return String(value)
}

/**
 * Format invoice details for display
 */
function formatInvoice(invoice: Record<string, unknown>): string {
  const parts: string[] = []

  if (invoice.invoiceNumber) {
    parts.push(`#${invoice.invoiceNumber}`)
  }

  if (invoice.providerName) {
    parts.push(String(invoice.providerName))
  }

  if (typeof invoice.amountSubmitted === 'number') {
    const amount = invoice.amountSubmitted.toLocaleString('es-PA', {
      style: 'currency',
      currency: 'USD',
    })
    parts.push(amount)
  }

  return parts.join(' - ') || 'Factura'
}
