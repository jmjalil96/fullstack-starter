/**
 * auditLogs.dto.ts
 * Data Transfer Objects for claim audit logs endpoint
 */

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/**
 * Individual field change within an audit log entry
 */
export interface AuditLogChange {
  /** Field key (e.g., 'status', 'amountSubmitted') */
  field: string
  /** Spanish label for display (e.g., 'Estado', 'Monto Presentado') */
  fieldLabel: string
  /** Previous value (formatted for display) */
  oldValue: string | null
  /** New value (formatted for display) */
  newValue: string | null
}

/**
 * Single audit log entry
 */
export interface AuditLogItem {
  /** Unique audit log ID */
  id: string
  /** Action type (e.g., 'CLAIM_UPDATED', 'CLAIM_INVOICE_ADDED') */
  action: string
  /** Spanish action label (e.g., 'Reclamo actualizado', 'Factura agregada') */
  actionLabel: string
  /** Name of user who performed the action */
  userName: string | null
  /** List of individual field changes */
  changes: AuditLogChange[]
  /** Additional metadata from the audit log */
  metadata: Record<string, unknown> | null
  /** ISO timestamp when action occurred */
  createdAt: string
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

/**
 * GET /api/claims/:id/audit-logs response
 */
export interface GetAuditLogsResponse {
  items: AuditLogItem[]
  pagination: PaginationMeta
}
