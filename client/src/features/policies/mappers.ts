import type { PolicyDetailResponse, UpdatePolicyRequest } from '../../shared/types/policies'

import type { PolicyEditFormData } from './editSchema'

/**
 * Convert PolicyDetailResponse to form default values
 * Handles number → string conversion for currency inputs
 */
export function getPolicyFormValues(policy: PolicyDetailResponse | undefined): PolicyEditFormData {
  return {
    policyNumber: policy?.policyNumber || '',
    type: policy?.type || '',
    clientId: policy?.clientId || '',
    insurerId: policy?.insurerId || '',
    startDate: policy?.startDate || '',
    endDate: policy?.endDate || '',
    ambCopay: policy?.ambCopay !== null && policy?.ambCopay !== undefined ? String(policy.ambCopay) : '',
    hospCopay: policy?.hospCopay !== null && policy?.hospCopay !== undefined ? String(policy.hospCopay) : '',
    maternity: policy?.maternity !== null && policy?.maternity !== undefined ? String(policy.maternity) : '',
    tPremium: policy?.tPremium !== null && policy?.tPremium !== undefined ? String(policy.tPremium) : '',
    tplus1Premium: policy?.tplus1Premium !== null && policy?.tplus1Premium !== undefined ? String(policy.tplus1Premium) : '',
    tplusfPremium: policy?.tplusfPremium !== null && policy?.tplusfPremium !== undefined ? String(policy.tplusfPremium) : '',
    taxRate: policy?.taxRate !== null && policy?.taxRate !== undefined ? String(policy.taxRate) : '',
    additionalCosts: policy?.additionalCosts !== null && policy?.additionalCosts !== undefined ? String(policy.additionalCosts) : '',
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
export function mapPolicyEditFormToUpdateRequest(
  form: PolicyEditFormData,
  dirty: Record<string, boolean | undefined>
): UpdatePolicyRequest {
  const dto: UpdatePolicyRequest = {}

  // String fields (simple)
  if (dirty.policyNumber) dto.policyNumber = form.policyNumber || undefined
  if (dirty.type) dto.type = form.type === '' ? null : form.type
  if (dirty.clientId) dto.clientId = form.clientId || undefined
  if (dirty.insurerId) dto.insurerId = form.insurerId || undefined
  if (dirty.startDate) dto.startDate = form.startDate || undefined
  if (dirty.endDate) dto.endDate = form.endDate || undefined

  // Numeric fields (convert string → number | null)
  if (dirty.ambCopay) dto.ambCopay = toNumberOrNull(form.ambCopay)
  if (dirty.hospCopay) dto.hospCopay = toNumberOrNull(form.hospCopay)
  if (dirty.maternity) dto.maternity = toNumberOrNull(form.maternity)
  if (dirty.tPremium) dto.tPremium = toNumberOrNull(form.tPremium)
  if (dirty.tplus1Premium) dto.tplus1Premium = toNumberOrNull(form.tplus1Premium)
  if (dirty.tplusfPremium) dto.tplusfPremium = toNumberOrNull(form.tplusfPremium)
  if (dirty.taxRate) dto.taxRate = toNumberOrNull(form.taxRate)
  if (dirty.additionalCosts) dto.additionalCosts = toNumberOrNull(form.additionalCosts)

  // Status (enum)
  if (dirty.status) dto.status = form.status

  return dto
}
