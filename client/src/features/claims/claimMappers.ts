import type { ClaimUpdateRequest } from './claims'
import type { ClaimUpdateFormData } from './schemas/editClaimSchema'

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
export function mapClaimEditFormToUpdateRequest(
  form: ClaimUpdateFormData,
  dirty: Record<string, boolean | undefined>
): ClaimUpdateRequest {
  const dto: ClaimUpdateRequest = {}

  // String fields (simple)
  if (dirty.description) dto.description = form.description === '' ? null : form.description
  if (dirty.type) dto.type = form.type === '' ? null : form.type
  if (dirty.policyId) dto.policyId = form.policyId === '' ? null : form.policyId

  // Date fields (ISO strings, empty → undefined to omit)
  if (dirty.incidentDate) dto.incidentDate = form.incidentDate || undefined
  if (dirty.submittedDate) dto.submittedDate = form.submittedDate || undefined
  if (dirty.resolvedDate) dto.resolvedDate = form.resolvedDate || undefined

  // Numeric fields (convert string → number | null)
  if (dirty.amount) dto.amount = toNumberOrNull(form.amount)
  if (dirty.approvedAmount) dto.approvedAmount = toNumberOrNull(form.approvedAmount)

  // Status (enum)
  if (dirty.status) dto.status = form.status

  return dto
}
