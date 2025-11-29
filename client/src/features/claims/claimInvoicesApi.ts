/**
 * Claim Invoices API service layer
 * Type-safe wrappers around fetchAPI for claim invoice endpoints
 */

import { fetchAPI } from '../../config/api'

import type {
  AddClaimInvoiceRequest,
  ClaimInvoiceResponse,
  EditClaimInvoiceRequest,
  RemoveClaimInvoiceResponse,
} from './claims'

/**
 * Add an invoice to a claim
 *
 * @param claimId - Claim ID to add invoice to
 * @param data - Invoice data (invoiceNumber, providerName, amountSubmitted)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Created invoice with all fields
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const invoice = await addClaimInvoice('claim-123', {
 *   invoiceNumber: 'FAC-001',
 *   providerName: 'Hospital ABC',
 *   amountSubmitted: 500.00
 * })
 */
export async function addClaimInvoice(
  claimId: string,
  data: AddClaimInvoiceRequest,
  options?: RequestInit
): Promise<ClaimInvoiceResponse> {
  return fetchAPI<ClaimInvoiceResponse>(`/api/claims/${claimId}/invoices`, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * Edit a claim invoice
 *
 * Only sends fields that are defined (undefined values omitted).
 *
 * @param claimId - Claim ID the invoice belongs to
 * @param invoiceId - Invoice ID to edit
 * @param data - Partial invoice updates (all fields optional)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Updated invoice with all fields
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const invoice = await editClaimInvoice('claim-123', 'invoice-456', {
 *   amountSubmitted: 600.00
 * })
 */
export async function editClaimInvoice(
  claimId: string,
  invoiceId: string,
  data: EditClaimInvoiceRequest,
  options?: RequestInit
): Promise<ClaimInvoiceResponse> {
  // Filter out undefined values (fields not changed)
  const cleanedData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  )

  return fetchAPI<ClaimInvoiceResponse>(
    `/api/claims/${claimId}/invoices/${invoiceId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(cleanedData),
      ...options,
    }
  )
}

/**
 * Remove an invoice from a claim
 *
 * @param claimId - Claim ID the invoice belongs to
 * @param invoiceId - Invoice ID to remove
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Success response with message
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const result = await removeClaimInvoice('claim-123', 'invoice-456')
 * // Returns: { success: true, message: 'Factura eliminada exitosamente' }
 */
export async function removeClaimInvoice(
  claimId: string,
  invoiceId: string,
  options?: RequestInit
): Promise<RemoveClaimInvoiceResponse> {
  return fetchAPI<RemoveClaimInvoiceResponse>(
    `/api/claims/${claimId}/invoices/${invoiceId}`,
    {
      method: 'DELETE',
      ...options,
    }
  )
}
