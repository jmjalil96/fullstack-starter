import type { AgentDetailResponse, UpdateAgentRequest } from './agents'
import type { AgentUpdateFormData } from './schemas/updateAgentSchema'

/**
 * Convert AgentDetailResponse to form default values
 * Handles null → empty string conversion for form inputs
 */
export function getAgentFormValues(agent: AgentDetailResponse | undefined): AgentUpdateFormData {
  return {
    firstName: agent?.firstName || '',
    lastName: agent?.lastName || '',
    phone: agent?.phone || '',
    agentCode: agent?.agentCode || '',
    isActive: agent?.isActive ?? true,
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
 * Map edit form data to API request (only dirty fields)
 */
export function mapAgentEditFormToUpdateRequest(
  form: AgentUpdateFormData,
  dirty: Record<string, boolean | undefined>
): UpdateAgentRequest {
  const dto: UpdateAgentRequest = {}

  if (dirty.firstName) dto.firstName = form.firstName
  if (dirty.lastName) dto.lastName = form.lastName
  if (dirty.phone) dto.phone = toNullable(form.phone as string | null | undefined)
  if (dirty.agentCode) dto.agentCode = toNullable(form.agentCode as string | null | undefined)
  if (dirty.isActive) dto.isActive = form.isActive

  return dto
}
