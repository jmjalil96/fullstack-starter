/**
 * removeClaimInvoice.dto.ts
 * DTOs for removing invoices from claims
 */

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/**
 * Response after removing an invoice from a claim
 */
export interface RemoveClaimInvoiceResponse {
  success: boolean
  message: string
}
