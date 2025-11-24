/**
 * Invoices API service layer
 * Type-safe wrappers around fetchAPI for invoices endpoints
 */

import { fetchAPI } from '../../config/api'

import type {
  AvailableClientResponse,
  AvailablePolicyResponse,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  GetInvoicesResponse,
  InvoiceDetailResponse,
  InvoiceStatus,
  InvoiceUpdateRequest,
  PaymentStatus,
  ValidateInvoiceResponse,
} from './invoices'

/**
 * Get available clients for invoice creation
 *
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Array of active clients
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const clients = await getAvailableClients()
 * // Returns: [{ id: '...', name: 'TechCorp' }, ...]
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const clients = await getAvailableClients({ signal: controller.signal })
 */
export async function getAvailableClients(
  options?: RequestInit
): Promise<AvailableClientResponse[]> {
  return fetchAPI<AvailableClientResponse[]>('/api/invoices/available-clients', options)
}

/**
 * Get available policies for invoice assignment
 *
 * Returns policies that can be associated with an invoice.
 * Filter by client and/or insurer to narrow down results.
 *
 * @param params - Optional query parameters (clientId, insurerId)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Array of available policies with policy number and dates
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * // Get all available policies
 * const policies = await getAvailablePolicies()
 * // Returns: [{ id: '...', policyNumber: 'POL-ABC-001', type: 'Salud', ... }, ...]
 *
 * @example
 * // Filter by client
 * const policies = await getAvailablePolicies({ clientId: 'client-123' })
 *
 * @example
 * // Filter by client and insurer
 * const policies = await getAvailablePolicies({
 *   clientId: 'client-123',
 *   insurerId: 'insurer-456'
 * })
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const policies = await getAvailablePolicies({ clientId: 'client-123' }, { signal: controller.signal })
 */
export async function getAvailablePolicies(
  params?: {
    clientId?: string
    insurerId?: string
  },
  options?: RequestInit
): Promise<AvailablePolicyResponse[]> {
  const searchParams = new URLSearchParams()

  if (params?.clientId) {
    searchParams.append('clientId', params.clientId)
  }
  if (params?.insurerId) {
    searchParams.append('insurerId', params.insurerId)
  }

  const queryString = searchParams.toString()
  const endpoint = `/api/invoices/available-policies${queryString ? `?${queryString}` : ''}`

  return fetchAPI<AvailablePolicyResponse[]>(endpoint, options)
}

/**
 * Create a new invoice
 *
 * Creates invoice with status PENDING and paymentStatus PENDING_PAYMENT.
 * Policies can be attached during creation via policyIds array.
 *
 * @param data - Invoice data (invoiceNumber, client, insurer, amounts, dates, optional policies)
 * @returns Created invoice with PENDING status
 * @throws {ApiRequestError} If request fails (400, 403, 404, 409)
 *
 * @example
 * const invoice = await createInvoice({
 *   invoiceNumber: 'INV-2025-001',
 *   insurerInvoiceNumber: 'MAPFRE-123456',
 *   clientId: 'client-123',
 *   insurerId: 'insurer-456',
 *   billingPeriod: '2025-01',
 *   totalAmount: 10000,
 *   taxAmount: 1500,
 *   actualAffiliateCount: 50,
 *   issueDate: '2025-01-15',
 *   dueDate: '2025-02-15',
 *   policyIds: ['policy-789']
 * })
 * // Returns: { id: '...', invoiceNumber: 'INV-2025-001', status: 'PENDING', ... }
 */
export async function createInvoice(data: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
  return fetchAPI<CreateInvoiceResponse>('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Get paginated list of invoices with optional filters
 *
 * Returns invoices based on user's role and permissions.
 * Backend applies defaults: page=1, limit=20
 *
 * @param params - Optional query parameters for filtering and pagination
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Paginated invoices list with metadata
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * // Get first page with defaults
 * const response = await getInvoices()
 * // Returns: { invoices: [...], pagination: { total, page: 1, limit: 20, ... } }
 *
 * @example
 * // Filter by status
 * const response = await getInvoices({ status: 'VALIDATED' })
 *
 * @example
 * // Filter by payment status
 * const response = await getInvoices({ paymentStatus: 'PAID' })
 *
 * @example
 * // Filter by client
 * const response = await getInvoices({ clientId: 'client-123' })
 *
 * @example
 * // Filter by insurer
 * const response = await getInvoices({ insurerId: 'insurer-456' })
 *
 * @example
 * // Search by invoice number
 * const response = await getInvoices({ search: 'INV-2025-001' })
 *
 * @example
 * // With pagination
 * const response = await getInvoices({ page: 2, limit: 10 })
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const response = await getInvoices({ page: 1 }, { signal: controller.signal })
 */
export async function getInvoices(
  params?: {
    status?: InvoiceStatus
    paymentStatus?: PaymentStatus
    clientId?: string
    insurerId?: string
    search?: string
    page?: number
    limit?: number
  },
  options?: RequestInit
): Promise<GetInvoicesResponse> {
  const searchParams = new URLSearchParams()

  if (params?.status) {
    searchParams.append('status', params.status)
  }
  if (params?.paymentStatus) {
    searchParams.append('paymentStatus', params.paymentStatus)
  }
  if (params?.clientId) {
    searchParams.append('clientId', params.clientId)
  }
  if (params?.insurerId) {
    searchParams.append('insurerId', params.insurerId)
  }
  if (params?.search) {
    searchParams.append('search', params.search)
  }
  if (params?.page !== undefined) {
    searchParams.append('page', params.page.toString())
  }
  if (params?.limit !== undefined) {
    searchParams.append('limit', params.limit.toString())
  }

  const queryString = searchParams.toString()
  const endpoint = `/api/invoices${queryString ? `?${queryString}` : ''}`

  return fetchAPI<GetInvoicesResponse>(endpoint, options)
}

/**
 * Get complete invoice detail by ID
 *
 * @param invoiceId - Invoice ID to fetch (CUID)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Complete invoice with all fields, related entities, and associated policies
 * @throws {ApiRequestError} If request fails (404 if not found or no access)
 *
 * @example
 * const invoice = await getInvoiceById('invoice-123')
 * // Returns: { id: '...', invoiceNumber: 'INV-2025-001', status: 'PENDING', policies: [...], ... }
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const invoice = await getInvoiceById('invoice-123', { signal: controller.signal })
 */
export async function getInvoiceById(
  invoiceId: string,
  options?: RequestInit
): Promise<InvoiceDetailResponse> {
  return fetchAPI<InvoiceDetailResponse>(`/api/invoices/${invoiceId}`, options)
}

/**
 * Update an invoice with partial data
 *
 * Only sends fields that are defined (undefined values omitted).
 * Null values are kept (used to clear optional fields).
 *
 * Field editability varies by invoice status:
 * - PENDING: All data fields editable
 * - VALIDATED: Payment fields only (paymentStatus, paymentDate, discrepancyNotes)
 * - DISCREPANCY: Correction fields + payment fields editable
 * - CANCELLED: Only discrepancyNotes (SUPER_ADMIN only)
 *
 * @param invoiceId - Invoice ID to update (CUID)
 * @param updates - Partial invoice updates (all fields optional)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Updated invoice with all fields
 * @throws {ApiRequestError} If request fails (400, 403, 404, 409)
 *
 * @example
 * // Update single field
 * const updated = await updateInvoice('invoice-123', { taxAmount: 2000 })
 *
 * @example
 * // Update multiple fields
 * const updated = await updateInvoice('invoice-123', {
 *   totalAmount: 12000,
 *   taxAmount: 1800,
 *   actualAffiliateCount: 55
 * })
 *
 * @example
 * // Status transition
 * const updated = await updateInvoice('invoice-123', { status: 'VALIDATED' })
 *
 * @example
 * // Mark as paid
 * const updated = await updateInvoice('invoice-123', {
 *   paymentStatus: 'PAID',
 *   paymentDate: '2025-02-10'
 * })
 *
 * @example
 * // Clear optional field
 * const updated = await updateInvoice('invoice-123', { discrepancyNotes: null })
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const updated = await updateInvoice('invoice-123', { taxAmount: 2000 }, { signal: controller.signal })
 */
export async function updateInvoice(
  invoiceId: string,
  updates: InvoiceUpdateRequest,
  options?: RequestInit
): Promise<InvoiceDetailResponse> {
  // Filter out undefined values (fields not changed)
  // Keep null values (intentional field clearing)
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  )

  return fetchAPI<InvoiceDetailResponse>(`/api/invoices/${invoiceId}`, {
    method: 'PUT',
    body: JSON.stringify(cleanedUpdates),
    ...options,
  })
}

/**
 * Validate an invoice by calculating expected amounts and counts
 *
 * Triggers validation calculation for attached policies:
 * - Calculates expectedAmount from policy costs and affiliate counts
 * - Calculates expectedAffiliateCount from policy affiliates
 * - Sets amountMatches and countMatches flags
 *
 * Invoice status remains PENDING - user must separately transition to
 * VALIDATED/DISCREPANCY via updateInvoice after reviewing validation results.
 *
 * @param invoiceId - Invoice ID to validate (CUID)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Updated invoice with calculated validation fields
 * @throws {ApiRequestError} If request fails (400, 403, 404)
 *
 * @example
 * const validated = await validateInvoice('invoice-123')
 * // Returns: {
 * //   id: '...',
 * //   status: 'PENDING',
 * //   expectedAmount: 10000,
 * //   expectedAffiliateCount: 50,
 * //   amountMatches: true,
 * //   countMatches: true,
 * //   ...
 * // }
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const validated = await validateInvoice('invoice-123', { signal: controller.signal })
 */
export async function validateInvoice(
  invoiceId: string,
  options?: RequestInit
): Promise<ValidateInvoiceResponse> {
  return fetchAPI<ValidateInvoiceResponse>(`/api/invoices/${invoiceId}/validate`, {
    method: 'POST',
    ...options,
  })
}
