import type { AffiliateDetailResponse, UpdateAffiliateRequest } from '../../features/affiliates/affiliates'

import type { AffiliateUpdateFormData } from './schemas/updateAffiliateSchema'

/**
 * Convert AffiliateDetailResponse to form default values
 * Handles null → empty string conversion for form inputs
 */
export function getAffiliateFormValues(affiliate: AffiliateDetailResponse | undefined): AffiliateUpdateFormData {
  return {
    firstName: affiliate?.firstName || '',
    lastName: affiliate?.lastName || '',
    email: affiliate?.email || '',
    phone: affiliate?.phone || '',
    dateOfBirth: affiliate?.dateOfBirth || '',
    documentType: affiliate?.documentType || '',
    documentNumber: affiliate?.documentNumber || '',
    affiliateType: affiliate?.affiliateType || 'OWNER',
    coverageType: affiliate?.coverageType || '',
    primaryAffiliateId: affiliate?.primaryAffiliateId || '',
    isActive: affiliate?.isActive ?? true,
  }
}

const toNullable = (val: string | null | undefined): string | null | undefined => {
  if (val === undefined) return undefined
  if (val === '') return null
  return val
}

export function mapAffiliateEditFormToUpdateRequest(
  form: AffiliateUpdateFormData,
  dirty: Record<string, boolean | undefined>
): UpdateAffiliateRequest {
  const dto: UpdateAffiliateRequest = {}

  if (dirty.firstName) dto.firstName = form.firstName
  if (dirty.lastName) dto.lastName = form.lastName
  if (dirty.email) dto.email = toNullable(form.email as string | null | undefined)
  if (dirty.phone) dto.phone = toNullable(form.phone as string | null | undefined)
  if (dirty.dateOfBirth) dto.dateOfBirth = toNullable(form.dateOfBirth as string | null | undefined)
  if (dirty.documentType)
    dto.documentType = toNullable(form.documentType as string | null | undefined)
  if (dirty.documentNumber)
    dto.documentNumber = toNullable(form.documentNumber as string | null | undefined)
  if (dirty.affiliateType) dto.affiliateType = form.affiliateType
  if (dirty.coverageType) {
    const value = toNullable(form.coverageType as string | null | undefined)
    dto.coverageType = value as 'T' | 'TPLUS1' | 'TPLUSF' | null | undefined
  }
  if (dirty.primaryAffiliateId)
    dto.primaryAffiliateId = toNullable(
      form.primaryAffiliateId as string | null | undefined
    )
  if (dirty.isActive) dto.isActive = form.isActive

  return dto
}


