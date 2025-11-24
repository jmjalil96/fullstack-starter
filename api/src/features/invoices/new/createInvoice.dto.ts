/**
 * DTOs for creating invoices
 */

import { InvoiceStatus, PaymentStatus } from '@prisma/client'

/**
 * Request DTO - What client sends
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

  /** Invoice issue date */
  issueDate: string // Will be Date object after Zod coercion

  /** Payment due date (optional) */
  dueDate?: string // Will be Date object after Zod coercion

  /** Policy IDs to attach to this invoice (optional) */
  policyIds?: string[]
}

/**
 * Response DTO - What API returns after creation
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

  issueDate: string // "2024-01-01" format
  dueDate: string | null
  paymentDate: string | null

  createdAt: string
  updatedAt: string
}
