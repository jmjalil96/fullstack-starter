import type { CareType, ClaimUpdateRequest } from './claims'
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
 * Converts string to integer, handling empty strings and invalid inputs
 */
const toIntOrNull = (val?: string): number | null | undefined => {
  if (val === undefined) return undefined // Field untouched
  if (val.trim() === '') return null // Explicitly cleared
  const n = parseInt(val, 10)
  return Number.isNaN(n) ? undefined : n
}

/**
 * Maps form data (strings) to API request (numbers, enums, etc.)
 * Only includes dirty fields
 */
export function mapClaimEditFormToUpdateRequest(
  form: ClaimUpdateFormData,
  dirty: Record<string, boolean | undefined>
): ClaimUpdateRequest {
  const dto: ClaimUpdateRequest = {}

  // ============================================================================
  // STRING FIELDS
  // ============================================================================

  if (dirty.description) dto.description = form.description === '' ? null : form.description
  if (dirty.diagnosisCode) dto.diagnosisCode = form.diagnosisCode === '' ? null : form.diagnosisCode
  if (dirty.diagnosisDescription)
    dto.diagnosisDescription = form.diagnosisDescription === '' ? null : form.diagnosisDescription
  if (dirty.settlementNumber) dto.settlementNumber = form.settlementNumber === '' ? null : form.settlementNumber
  if (dirty.settlementNotes) dto.settlementNotes = form.settlementNotes === '' ? null : form.settlementNotes
  if (dirty.policyId) dto.policyId = form.policyId === '' ? null : form.policyId

  // ============================================================================
  // ENUM FIELDS
  // ============================================================================

  if (dirty.careType) dto.careType = form.careType === '' ? null : (form.careType as CareType | null)
  if (dirty.status) dto.status = form.status

  // ============================================================================
  // DATE FIELDS (ISO strings, empty → undefined to omit)
  // ============================================================================

  if (dirty.incidentDate) dto.incidentDate = form.incidentDate || undefined
  if (dirty.submittedDate) dto.submittedDate = form.submittedDate || undefined
  if (dirty.settlementDate) dto.settlementDate = form.settlementDate || undefined

  // ============================================================================
  // NUMERIC FIELDS (convert string → number | null)
  // ============================================================================

  if (dirty.amountSubmitted) dto.amountSubmitted = toNumberOrNull(form.amountSubmitted)
  if (dirty.amountApproved) dto.amountApproved = toNumberOrNull(form.amountApproved)
  if (dirty.amountDenied) dto.amountDenied = toNumberOrNull(form.amountDenied)
  if (dirty.amountUnprocessed) dto.amountUnprocessed = toNumberOrNull(form.amountUnprocessed)
  if (dirty.deductibleApplied) dto.deductibleApplied = toNumberOrNull(form.deductibleApplied)
  if (dirty.copayApplied) dto.copayApplied = toNumberOrNull(form.copayApplied)
  if (dirty.businessDays) dto.businessDays = toIntOrNull(form.businessDays)

  return dto
}
