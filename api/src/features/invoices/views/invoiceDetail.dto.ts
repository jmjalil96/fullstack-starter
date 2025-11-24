/**
 * DTO for invoice detail view (GET /api/invoices/:id)
 */

import type { InvoiceStatus, PaymentStatus } from '@prisma/client'

/**
 * Policy associated with this invoice (from InvoicePolicy join table)
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
 * Complete invoice detail with all fields from Invoice table
 * plus minimal references to related entities (id + display name)
 * plus associated policies with their validation breakdown
 *
 * Follows flat structure pattern for consistency
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
