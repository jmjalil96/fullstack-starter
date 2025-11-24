import type { ClientDetailResponse, UpdateClientRequest } from '../../shared/types/clients'

import type { ClientUpdateFormData } from './clientUpdateSchema'

/**
 * Convert ClientDetailResponse to form default values
 * Handles null → empty string conversion for form inputs
 */
export function getClientFormValues(client: ClientDetailResponse | undefined): ClientUpdateFormData {
  return {
    name: client?.name || '',
    taxId: client?.taxId || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    isActive: client?.isActive ?? true,
  }
}

/**
 * Maps client edit form to API update request
 * Only includes dirty fields, converts empty strings to null for nullable fields
 */
export function mapClientEditFormToUpdateRequest(
  form: ClientUpdateFormData,
  dirty: Record<string, boolean | undefined>
): UpdateClientRequest {
  const dto: UpdateClientRequest = {}

  // Required fields (string)
  if (dirty.name) dto.name = form.name
  if (dirty.taxId) dto.taxId = form.taxId

  // Optional fields (null to clear)
  if (dirty.email) dto.email = form.email || null
  if (dirty.phone) dto.phone = form.phone || null
  if (dirty.address) dto.address = form.address || null

  // Boolean field
  if (dirty.isActive !== undefined) dto.isActive = form.isActive

  return dto
}
