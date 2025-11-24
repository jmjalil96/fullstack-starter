/**
 * Invoices type definitions
 * Mirrors backend DTOs from api/src/features/invoices/
 */

import type { PaginationMetadata } from './common'

// Re-export for convenience
export type { PaginationMetadata }

// ============================================================================
// LOOKUP / PICKLIST RESPONSES
// ============================================================================

/**
 * Available client response (for picklist)
 * Returned from GET /api/invoices/available-clients
 * Mirrors: api/src/features/invoices/lookups/clients.dto.ts
 */
export interface AvailableClientResponse {
  id: string
  name: string
}

/**
 * Available policy response (for picklist)
 * Returned from GET /api/invoices/available-policies
 * Mirrors: api/src/features/invoices/lookups/policies.dto.ts
 */
export interface AvailablePolicyResponse {
  id: string
  policyNumber: string
  type: string | null
  startDate: string
  endDate: string
}

// ============================================================================
// CREATE TYPES
// ============================================================================

/**
 * Create invoice request body
 * Sent to POST /api/invoices
 * Mirrors: api/src/features/invoices/new/createInvoice.dto.ts
 */
export interface CreateInvoiceRequest {
  /** Invoice number (our internal identifier) */
  invoiceNumber: string

  /** Insurer's invoice number (their reference) */
  insurerInvoiceNumber: string

  /** Client ID (company being billed) */
  clientId: string

  /** Insurer ID (insurance carrier issuing invoice) */
  insurerId: string

  /** Billing period (e.g., "2025-01" for January 2025) */
  billingPeriod: string

  /** Total amount from insurer */
  totalAmount: number

  /** Tax amount (optional) */
  taxAmount?: number

  /** Number of affiliates insurer claims to be billing */
  actualAffiliateCount: number

  /** Invoice issue date (ISO 8601 date string) */
  issueDate: string

  /** Payment due date (ISO 8601 date string, optional) */
  dueDate?: string

  /** Policy IDs to attach to this invoice (optional) */
  policyIds?: string[]
}

/**
 * Create invoice response
 * Returned from POST /api/invoices
 * Mirrors: api/src/features/invoices/new/createInvoice.dto.ts
 */
export interface CreateInvoiceResponse {
  id: string
  invoiceNumber: string
  insurerInvoiceNumber: string
  status: InvoiceStatus
  paymentStatus: PaymentStatus

  clientId: string
  clientName: string

  insurerId: string
  insurerName: string

  billingPeriod: string | null
  totalAmount: number
  taxAmount: number | null
  actualAffiliateCount: number | null

  expectedAmount: number | null
  expectedAffiliateCount: number | null
  countMatches: boolean | null
  amountMatches: boolean | null

  discrepancyNotes: string | null

  issueDate: string // "2025-01-01" format
  dueDate: string | null
  paymentDate: string | null

  createdAt: string
  updatedAt: string
}

// ============================================================================
// STATUS ENUMS
// ============================================================================

/**
 * Invoice status enum values
 * Mirrors: @prisma/client
 * Lifecycle: PENDING → VALIDATED/DISCREPANCY → CANCELLED (terminal)
 */
export type InvoiceStatus = 'PENDING' | 'VALIDATED' | 'DISCREPANCY' | 'CANCELLED'

/**
 * Payment status enum values
 * Mirrors: @prisma/client
 */
export type PaymentStatus = 'PENDING_PAYMENT' | 'PAID'

// ============================================================================
// LIST VIEW TYPES
// ============================================================================

/**
 * Single invoice item in list view
 * Lightweight summary with flat structure (no nested objects)
 * Returned from GET /api/invoices
 * Mirrors: api/src/features/invoices/views/viewInvoices.dto.ts
 */
export interface InvoiceListItemResponse {
  // Core identification
  id: string
  invoiceNumber: string
  insurerInvoiceNumber: string

  // Status
  status: InvoiceStatus
  paymentStatus: PaymentStatus

  // Client info (flat)
  clientId: string
  clientName: string

  // Insurer info (flat)
  insurerId: string
  insurerName: string

  // Billing info
  billingPeriod: string | null
  totalAmount: number
  expectedAmount: number | null

  // Validation flags
  countMatches: boolean | null
  amountMatches: boolean | null

  // Dates (ISO strings)
  issueDate: string // "2025-01-01" format
  dueDate: string | null
  paymentDate: string | null
  createdAt: string
}

/**
 * Response from GET /api/invoices
 * Returns paginated list of invoices with metadata
 * Mirrors: api/src/features/invoices/views/viewInvoices.dto.ts
 */
export interface GetInvoicesResponse {
  /** Array of invoice summaries */
  invoices: InvoiceListItemResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata
}

// ============================================================================
// DETAIL VIEW TYPES
// ============================================================================

/**
 * Policy associated with an invoice (from InvoicePolicy join table)
 * Nested within InvoiceDetailResponse
 * Mirrors: api/src/features/invoices/views/invoiceDetail.dto.ts
 */
export interface InvoicePolicyDetail {
  /** Policy ID */
  policyId: string

  /** Policy number for display */
  policyNumber: string

  /** Expected amount for this policy */
  expectedAmount: number

  /** Breakdown of costs by coverage tier (JSON) */
  expectedBreakdown: Record<string, unknown>

  /** Expected affiliate count for this policy */
  expectedAffiliateCount: number

  /** When this policy was added to the invoice */
  addedAt: string
}

/**
 * Complete invoice detail with all fields
 * Returned from GET /api/invoices/:id
 * Mirrors: api/src/features/invoices/views/invoiceDetail.dto.ts
 */
export interface InvoiceDetailResponse {
  // ============================================================================
  // INVOICE TABLE - ALL FIELDS
  // ============================================================================

  /** Unique invoice ID (CUID) */
  id: string

  /** Internal invoice number (unique business identifier) */
  invoiceNumber: string

  /** Insurer's invoice number (their reference) */
  insurerInvoiceNumber: string

  /** Validation status (PENDING, VALIDATED, DISCREPANCY, CANCELLED) */
  status: InvoiceStatus

  /** Payment status (PENDING_PAYMENT, PAID) */
  paymentStatus: PaymentStatus

  /** Billing period (e.g., "2025-01" for January 2025) */
  billingPeriod: string | null

  // Amounts
  /** Total amount from insurer */
  totalAmount: number

  /** Tax amount */
  taxAmount: number | null

  // Affiliate count validation
  /** Expected number of affiliates (calculated) */
  expectedAffiliateCount: number | null

  /** Actual number of affiliates from insurer */
  actualAffiliateCount: number | null

  /** Whether affiliate counts match */
  countMatches: boolean | null

  // Amount validation
  /** Expected total amount (calculated from policies) */
  expectedAmount: number | null

  /** Whether amounts match */
  amountMatches: boolean | null

  /** Notes about discrepancies */
  discrepancyNotes: string | null

  // File attachments (optional - S3 integration not yet implemented)
  /** URL to invoice file (e.g., PDF from S3) */
  fileUrl: string | null

  /** Original file name */
  fileName: string | null

  /** File size in bytes */
  fileSize: number | null

  /** MIME type (e.g., "application/pdf") */
  mimeType: string | null

  /** When the file was uploaded (ISO timestamp) */
  uploadedAt: string | null

  // Dates
  /** Invoice issue date (YYYY-MM-DD) */
  issueDate: string

  /** Payment due date (YYYY-MM-DD) */
  dueDate: string | null

  /** Actual payment date (YYYY-MM-DD) */
  paymentDate: string | null

  /** When the invoice was created */
  createdAt: string

  /** When the invoice was last updated */
  updatedAt: string

  // ============================================================================
  // RELATED ENTITIES - FLAT REFERENCES (ID + DISPLAY NAME)
  // ============================================================================

  /** Client ID */
  clientId: string

  /** Client name for display */
  clientName: string

  /** Insurer ID */
  insurerId: string

  /** Insurer name for display */
  insurerName: string

  /** ID of user who uploaded the invoice */
  uploadedById: string | null

  /** Name of user who uploaded the invoice */
  uploadedByName: string | null

  // ============================================================================
  // ASSOCIATED POLICIES (NESTED ARRAY)
  // ============================================================================

  /** List of policies associated with this invoice (from InvoicePolicy join table) */
  policies: InvoicePolicyDetail[]
}

// ============================================================================
// UPDATE TYPES
// ============================================================================

/**
 * Request body for updating an invoice
 * Sent to PUT /api/invoices/:id
 * Mirrors: api/src/features/invoices/edit/invoiceEdit.dto.ts
 *
 * All fields optional (partial update).
 * Null values clear fields.
 * Only send changed fields (omit undefined).
 *
 * Field editability varies by invoice status:
 * - PENDING: 11 data fields editable
 * - VALIDATED: 3 payment fields editable
 * - DISCREPANCY: 8 correction + payment fields editable
 * - CANCELLED: discrepancyNotes only (SUPER_ADMIN)
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
  paymentStatus?: PaymentStatus

  /** Actual payment date (ISO 8601 date string, can be null to clear) */
  paymentDate?: string | null

  /** New invoice status (triggers lifecycle validation) */
  status?: InvoiceStatus
}

/**
 * Update invoice response (same as detail response)
 * Returned from PUT /api/invoices/:id
 * Mirrors: api/src/features/invoices/edit/invoiceEdit.dto.ts
 */
export type InvoiceUpdateResponse = InvoiceDetailResponse

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Response from POST /api/invoices/:id/validate
 * Returns complete updated invoice with calculated validation fields
 * Mirrors: api/src/features/invoices/validate/validateInvoice.dto.ts
 *
 * Invoice status remains unchanged (PENDING) - user must separately
 * transition to VALIDATED/DISCREPANCY via PUT endpoint after review.
 */
export type ValidateInvoiceResponse = InvoiceDetailResponse
