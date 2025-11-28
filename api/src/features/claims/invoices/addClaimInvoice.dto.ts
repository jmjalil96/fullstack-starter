/**
 * addClaimInvoice.dto.ts
 * DTOs for adding invoices to claims
 */

// ============================================================================
// REQUEST DTOs
// ============================================================================

/**
 * Request body for adding an invoice to a claim
 */
export interface AddClaimInvoiceRequest {
  invoiceNumber: string
  providerName: string
  amountSubmitted: number
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/**
 * Response after adding an invoice to a claim
 */
export interface AddClaimInvoiceResponse {
  id: string
  claimId: string
  invoiceNumber: string
  providerName: string
  amountSubmitted: number
  createdById: string
  createdByName: string
  createdAt: string
}
