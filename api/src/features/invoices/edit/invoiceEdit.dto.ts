/**
 * DTOs for invoice editing endpoint (PUT /api/invoices/:id)
 *
 * Defines the request and response types for updating invoices.
 * Actual field editability depends on current invoice status (see lifecycle blueprint).
 */

import type { InvoiceLifecycleState } from '../shared/invoiceLifecycle.blueprint.js'
import type { InvoiceDetailResponse } from '../views/invoiceDetail.dto.js'

/**
 * Request body for updating an invoice
 *
 * All fields are optional (partial update pattern).
 * Fields marked as nullable can be explicitly set to null to clear them.
 *
 * Field editability varies by invoice status:
 * - PENDING: 11 data fields editable (BROKER_EMPLOYEES)
 * - VALIDATED: 3 payment fields editable (BROKER_EMPLOYEES)
 * - DISCREPANCY: 8 correction + payment fields editable (BROKER_EMPLOYEES)
 * - CANCELLED: 1 field editable - discrepancyNotes only (SUPER_ADMIN only)
 *
 * Status transition workflow (enforced by validator):
 * - PENDING → VALIDATED or DISCREPANCY (requires billingPeriod, taxAmount, actualAffiliateCount, dueDate)
 * - VALIDATED → DISCREPANCY or CANCELLED (no requirements)
 * - DISCREPANCY → VALIDATED (requires discrepancyNotes) or CANCELLED (no requirements)
 * - CANCELLED → None (terminal state)
 *
 * Date format:
 * - All date fields expect ISO 8601 strings (e.g., "2025-01-15")
 * - Validation/parsing handled by Zod schema layer
 *
 * @example
 * // Simple update (edit fields in PENDING)
 * {
 *   "billingPeriod": "2025-03",
 *   "totalAmount": 15000,
 *   "taxAmount": 2700
 * }
 *
 * @example
 * // Transition from PENDING to VALIDATED (requirements must be met)
 * {
 *   "status": "VALIDATED",
 *   "billingPeriod": "2025-03",
 *   "taxAmount": 2700,
 *   "actualAffiliateCount": 30,
 *   "dueDate": "2025-03-15"
 * }
 *
 * @example
 * // Record payment in VALIDATED status
 * {
 *   "paymentStatus": "PAID",
 *   "paymentDate": "2025-03-20"
 * }
 *
 * @example
 * // Approve discrepancy with notes
 * {
 *   "status": "VALIDATED",
 *   "discrepancyNotes": "Insurer confirmed late fee of $100 is correct"
 * }
 */
export interface InvoiceUpdateRequest {
  /** Invoice number (our internal identifier) */
  invoiceNumber?: string

  /** Insurer's invoice number (their reference) */
  insurerInvoiceNumber?: string

  /** Client ID (company being billed) */
  clientId?: string

  /** Insurer ID (insurance carrier) */
  insurerId?: string

  /** Billing period (e.g., "2025-01") */
  billingPeriod?: string | null

  /** Total amount from insurer */
  totalAmount?: number

  /** Tax amount (can be null to clear) */
  taxAmount?: number | null

  /** Number of affiliates insurer claims to bill */
  actualAffiliateCount?: number | null

  /** Expected amount (manual override in DISCREPANCY, can be null) */
  expectedAmount?: number | null

  /** Notes about discrepancies or resolution */
  discrepancyNotes?: string | null

  /** Invoice issue date (ISO 8601 date string) */
  issueDate?: string

  /** Payment due date (ISO 8601 date string, can be null to clear) */
  dueDate?: string | null

  /** Payment status (PENDING_PAYMENT, PAID) */
  paymentStatus?: 'PENDING_PAYMENT' | 'PAID'

  /** Actual payment date (ISO 8601 date string, can be null to clear) */
  paymentDate?: string | null

  /**
   * New invoice status (triggers lifecycle validation)
   * Valid values: PENDING, VALIDATED, DISCREPANCY, CANCELLED
   * Transitions validated against blueprint rules
   */
  status?: InvoiceLifecycleState
}

/**
 * Response from PUT /api/invoices/:id
 *
 * Returns complete updated invoice with all fields (same structure as detail view).
 * Client receives full invoice state after update for consistency.
 *
 * @example
 * {
 *   "id": "abc123",
 *   "invoiceNumber": "INV-2025-001",
 *   "status": "VALIDATED",
 *   "paymentStatus": "PENDING_PAYMENT",
 *   "clientName": "TechCorp S.A.",
 *   "insurerName": "MAPFRE",
 *   "totalAmount": 15000,
 *   "expectedAmount": 14900,
 *   "policies": [...],
 *   ...all other InvoiceDetailResponse fields
 * }
 */
export type InvoiceUpdateResponse = InvoiceDetailResponse
