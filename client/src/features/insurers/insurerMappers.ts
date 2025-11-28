import type { CreateInsurerRequest, InsurerDetailResponse, UpdateInsurerRequest } from './insurers'
import type { InsurerCreateFormData } from './schemas/createInsurerSchema'
import type { InsurerUpdateFormData } from './schemas/updateInsurerSchema'

/**
 * Convert InsurerDetailResponse to form default values
 * Handles null → empty string conversion for form inputs
 */
export function getInsurerFormValues(insurer: InsurerDetailResponse | undefined): InsurerUpdateFormData {
  return {
    name: insurer?.name || '',
    code: insurer?.code || '',
    email: insurer?.email || '',
    phone: insurer?.phone || '',
    website: insurer?.website || '',
    isActive: insurer?.isActive ?? true,
  }
}

/**
 * Get default values for create form
 */
export function getInsurerCreateFormDefaults(): InsurerCreateFormData {
  return {
    name: '',
    code: '',
    email: '',
    phone: '',
    website: '',
  }
}

/**
 * Convert empty string to null for API request
 */
const toNullable = (val: string | null | undefined): string | null | undefined => {
  if (val === undefined) return undefined
  if (val === '') return null
  return val
}

/**
 * Convert empty string to undefined (omit from request) for create
 */
const toOptional = (val: string | undefined): string | undefined => {
  if (val === undefined || val === '') return undefined
  return val
}

/**
 * Map create form data to API request
 */
export function mapInsurerCreateFormToRequest(
  form: InsurerCreateFormData
): CreateInsurerRequest {
  const dto: CreateInsurerRequest = {
    name: form.name,
  }

  const code = toOptional(form.code)
  if (code) dto.code = code

  const email = toOptional(form.email)
  if (email) dto.email = email

  const phone = toOptional(form.phone)
  if (phone) dto.phone = phone

  const website = toOptional(form.website)
  if (website) dto.website = website

  return dto
}

/**
 * Map edit form data to API request (only dirty fields)
 */
export function mapInsurerEditFormToUpdateRequest(
  form: InsurerUpdateFormData,
  dirty: Record<string, boolean | undefined>
): UpdateInsurerRequest {
  const dto: UpdateInsurerRequest = {}

  if (dirty.name) dto.name = form.name
  if (dirty.code) dto.code = toNullable(form.code as string | null | undefined)
  if (dirty.email) dto.email = toNullable(form.email as string | null | undefined)
  if (dirty.phone) dto.phone = toNullable(form.phone as string | null | undefined)
  if (dirty.website) dto.website = toNullable(form.website as string | null | undefined)
  if (dirty.isActive) dto.isActive = form.isActive

  return dto
}
