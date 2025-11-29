/**
 * editClaimInvoice.dto.ts
 * DTOs for editing claim invoices
 */

// ============================================================================
// REQUEST DTOs
// ============================================================================

/**
 * Request body for editing a claim invoice
 *
 * All fields are optional (partial update).
 * At least one field must be provided.
 */
export interface EditClaimInvoiceRequest {
  invoiceNumber?: string
  providerName?: string
  amountSubmitted?: number
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/**
 * Response after editing a claim invoice
 */
export interface EditClaimInvoiceResponse {
  id: string
  claimId: string
  invoiceNumber: string
  providerName: string
  amountSubmitted: number
  createdById: string
  createdByName: string
  createdAt: string
}
