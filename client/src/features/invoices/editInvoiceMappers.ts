import type { InvoiceDetailResponse, InvoiceUpdateRequest } from './invoices'
import type { InvoiceEditFormData } from './schemas/editInvoiceSchema'

/**
 * Convert InvoiceDetailResponse to form default values
 * Handles number → string conversion for currency and number inputs
 */
export function getInvoiceFormValues(
  invoice: InvoiceDetailResponse | undefined
): InvoiceEditFormData {
  return {
    invoiceNumber: invoice?.invoiceNumber || '',
    clientId: invoice?.clientId || '',
    insurerId: invoice?.insurerId || '',
    billingPeriod: invoice?.billingPeriod || '',
    totalAmount:
      invoice?.totalAmount !== null && invoice?.totalAmount !== undefined
        ? String(invoice.totalAmount)
        : '',
    taxAmount:
      invoice?.taxAmount !== null && invoice?.taxAmount !== undefined
        ? String(invoice.taxAmount)
        : '',
    expectedAmount:
      invoice?.expectedAmount !== null && invoice?.expectedAmount !== undefined
        ? String(invoice.expectedAmount)
        : '',
    actualAffiliateCount:
      invoice?.actualAffiliateCount !== null && invoice?.actualAffiliateCount !== undefined
        ? String(invoice.actualAffiliateCount)
        : '',
    issueDate: invoice?.issueDate || '',
    dueDate: invoice?.dueDate || '',
    paymentDate: invoice?.paymentDate || '',
    paymentStatus: invoice?.paymentStatus || undefined,
    discrepancyNotes: invoice?.discrepancyNotes || '',
  }
}

/**
 * Converts string to number, handling empty strings and invalid inputs
 */
const toNumberOrNull = (val?: string): number | null | undefined => {
  if (val === undefined) return undefined // Field untouched
  if (val.trim() === '') return null // Explicitly cleared
  const n = Number(val.replace(',', '.'))
  return Number.isNaN(n) ? undefined : n
}

/**
 * Maps form data (strings) to API request (numbers, etc.)
 * Only includes dirty fields
 */
export function mapInvoiceEditFormToUpdateRequest(
  form: InvoiceEditFormData,
  dirty: Record<string, boolean | undefined>
): InvoiceUpdateRequest {
  const dto: InvoiceUpdateRequest = {}

  // String fields (simple)
  if (dirty.invoiceNumber) dto.invoiceNumber = form.invoiceNumber || undefined
  if (dirty.clientId) dto.clientId = form.clientId || undefined
  if (dirty.insurerId) dto.insurerId = form.insurerId || undefined
  if (dirty.billingPeriod) dto.billingPeriod = form.billingPeriod === '' ? null : form.billingPeriod
  if (dirty.discrepancyNotes)
    dto.discrepancyNotes = form.discrepancyNotes === '' ? null : form.discrepancyNotes

  // Date fields (ISO strings)
  // issueDate: not nullable in backend, so empty → undefined (omit)
  if (dirty.issueDate) dto.issueDate = form.issueDate || undefined
  // dueDate and paymentDate: nullable in backend, so empty → null (clear)
  if (dirty.dueDate) dto.dueDate = form.dueDate === '' ? null : (form.dueDate || undefined)
  if (dirty.paymentDate)
    dto.paymentDate = form.paymentDate === '' ? null : (form.paymentDate || undefined)

  // Numeric fields (convert string → number | null)
  if (dirty.totalAmount) {
    const val = toNumberOrNull(form.totalAmount)
    if (val !== undefined) dto.totalAmount = val === null ? undefined : val
  }
  if (dirty.taxAmount) dto.taxAmount = toNumberOrNull(form.taxAmount)
  if (dirty.expectedAmount) dto.expectedAmount = toNumberOrNull(form.expectedAmount)
  if (dirty.actualAffiliateCount)
    dto.actualAffiliateCount = toNumberOrNull(form.actualAffiliateCount)

  // Enum fields
  if (dirty.paymentStatus) dto.paymentStatus = form.paymentStatus
  if (dirty.status) dto.status = form.status

  return dto
}
