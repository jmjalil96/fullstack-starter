/**
 * DTOs for viewing/listing invoices
 */

import { InvoiceStatus, PaymentStatus } from '@prisma/client'

/**
 * Query parameters for invoice list endpoint
 */
export interface GetInvoicesQueryParams {
  status?: InvoiceStatus
  paymentStatus?: PaymentStatus
  clientId?: string
  insurerId?: string
  search?: string
  page?: number
  limit?: number
}

/**
 * Single invoice item in list view (summary format)
 */
export interface InvoiceListItemResponse {
  // Core identification
  id: string
  invoiceNumber: string

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
 * Pagination metadata
 */
export interface PaginationMetadata {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

/**
 * Response for invoice list endpoint
 */
export interface GetInvoicesResponse {
  invoices: InvoiceListItemResponse[]
  pagination: PaginationMetadata
}
