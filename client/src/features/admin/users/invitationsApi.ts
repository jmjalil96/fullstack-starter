/**
 * Invitations API service layer
 * Type-safe wrappers around fetchAPI for invitations endpoints
 */

import { fetchAPI } from '../../../config/api'

import type {
  AcceptInvitationResponse,
  GetInvitableAffiliatesResponse,
  GetInvitationsResponse,
  InvitationStatus,
  InvitationType,
  InviteAffiliateRequest,
  InviteAffiliateResponse,
  InviteAffiliatesBulkRequest,
  InviteAffiliatesBulkResponse,
  InviteAgentRequest,
  InviteAgentResponse,
  InviteEmployeeRequest,
  InviteEmployeeResponse,
  ResendInvitationResponse,
  RevokeInvitationResponse,
  ValidateInvitationResponse,
} from './invitations'

/**
 * Validate an invitation token (public endpoint)
 *
 * Used before signup to verify the invitation is valid and get details.
 * Does not require authentication.
 *
 * @param token - Invitation token (hex string)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Validation result with invitation details if valid
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const result = await validateInvitation('abc123def456...')
 * if (result.valid) {
 *   // Show signup form with prefilled email
 *   console.log(result.email, result.type, result.name)
 * } else {
 *   // Show error with reason
 *   console.log(result.reason)
 * }
 */
export async function validateInvitation(
  token: string,
  options?: RequestInit
): Promise<ValidateInvitationResponse> {
  return fetchAPI<ValidateInvitationResponse>(`/api/invitations/${token}/validate`, options)
}

/**
 * Accept an invitation after signup
 *
 * Creates the corresponding entity (Employee, Agent) or links the Affiliate
 * and sets up the user account with appropriate role.
 *
 * @param token - Invitation token (hex string)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Acceptance result with user and entity details
 * @throws {ApiRequestError} If request fails (400, 404, 409)
 *
 * @example
 * const result = await acceptInvitation('abc123def456...')
 * // Returns: { success: true, user: {...}, type: 'EMPLOYEE', entityId: '...', message: '...' }
 */
export async function acceptInvitation(
  token: string,
  options?: RequestInit
): Promise<AcceptInvitationResponse> {
  return fetchAPI<AcceptInvitationResponse>(`/api/invitations/${token}/accept`, {
    method: 'POST',
    ...options,
  })
}

/**
 * Get paginated list of invitations with optional filters
 *
 * Returns invitations based on user's role.
 * Backend applies defaults: page=1, limit=20
 *
 * @param params - Optional query parameters for filtering and pagination
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Paginated invitations list with metadata
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * // Get first page with defaults
 * const response = await getInvitations()
 * // Returns: { invitations: [...], pagination: { total, page: 1, limit: 20, ... } }
 *
 * @example
 * // Filter by status
 * const response = await getInvitations({ status: 'PENDING' })
 *
 * @example
 * // Filter by type
 * const response = await getInvitations({ type: 'EMPLOYEE' })
 *
 * @example
 * // Search by email
 * const response = await getInvitations({ search: 'juan@' })
 *
 * @example
 * // With pagination
 * const response = await getInvitations({ page: 2, limit: 10 })
 */
export async function getInvitations(
  params?: {
    status?: InvitationStatus
    type?: InvitationType
    search?: string
    page?: number
    limit?: number
  },
  options?: RequestInit
): Promise<GetInvitationsResponse> {
  const searchParams = new URLSearchParams()

  if (params?.status) {
    searchParams.append('status', params.status)
  }
  if (params?.type) {
    searchParams.append('type', params.type)
  }
  if (params?.search) {
    searchParams.append('search', params.search)
  }
  if (params?.page !== undefined) {
    searchParams.append('page', params.page.toString())
  }
  if (params?.limit !== undefined) {
    searchParams.append('limit', params.limit.toString())
  }

  const queryString = searchParams.toString()
  const endpoint = `/api/invitations${queryString ? `?${queryString}` : ''}`

  return fetchAPI<GetInvitationsResponse>(endpoint, options)
}

/**
 * Resend an invitation email
 *
 * Resets expiration to 7 days from now and sends new email.
 * Only works for PENDING invitations.
 *
 * @param invitationId - Invitation ID to resend (CUID)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Updated invitation with new expiration
 * @throws {ApiRequestError} If request fails (400, 403, 404)
 *
 * @example
 * const result = await resendInvitation('invitation-123')
 * // Returns: { id: '...', email: '...', expiresAt: '...', message: '...' }
 */
export async function resendInvitation(
  invitationId: string,
  options?: RequestInit
): Promise<ResendInvitationResponse> {
  return fetchAPI<ResendInvitationResponse>(`/api/invitations/${invitationId}/resend`, {
    method: 'POST',
    ...options,
  })
}

/**
 * Revoke a pending invitation
 *
 * Sets status to REVOKED. Only works for PENDING invitations.
 *
 * @param invitationId - Invitation ID to revoke (CUID)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Revoked invitation details
 * @throws {ApiRequestError} If request fails (400, 403, 404)
 *
 * @example
 * const result = await revokeInvitation('invitation-123')
 * // Returns: { id: '...', email: '...', status: 'REVOKED', message: '...' }
 */
export async function revokeInvitation(
  invitationId: string,
  options?: RequestInit
): Promise<RevokeInvitationResponse> {
  return fetchAPI<RevokeInvitationResponse>(`/api/invitations/${invitationId}`, {
    method: 'DELETE',
    ...options,
  })
}

/**
 * Invite a new employee
 *
 * Creates invitation with embedded employee data.
 * Employee entity created when invitation is accepted.
 *
 * @param data - Employee invitation data
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Created invitation with employee details
 * @throws {ApiRequestError} If request fails (400, 403, 409)
 *
 * @example
 * const result = await inviteEmployee({
 *   email: 'juan@company.com',
 *   firstName: 'Juan',
 *   lastName: 'Pérez',
 *   roleId: 'role-123',
 *   position: 'Developer',
 *   department: 'Engineering'
 * })
 */
export async function inviteEmployee(
  data: InviteEmployeeRequest,
  options?: RequestInit
): Promise<InviteEmployeeResponse> {
  return fetchAPI<InviteEmployeeResponse>('/api/invitations/employee', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * Invite a new agent
 *
 * Creates invitation with embedded agent data.
 * Agent entity created when invitation is accepted.
 *
 * @param data - Agent invitation data
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Created invitation with agent details
 * @throws {ApiRequestError} If request fails (400, 403, 409)
 *
 * @example
 * const result = await inviteAgent({
 *   email: 'agent@broker.com',
 *   firstName: 'María',
 *   lastName: 'García',
 *   roleId: 'role-456',
 *   agentCode: 'AGT-001'
 * })
 */
export async function inviteAgent(
  data: InviteAgentRequest,
  options?: RequestInit
): Promise<InviteAgentResponse> {
  return fetchAPI<InviteAgentResponse>('/api/invitations/agent', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * Invite an existing affiliate
 *
 * Creates invitation for an affiliate that already exists.
 * Affiliate must have email and not have a user account yet.
 *
 * @param data - Affiliate invitation data
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Created invitation with affiliate details
 * @throws {ApiRequestError} If request fails (400, 403, 404, 409)
 *
 * @example
 * const result = await inviteAffiliate({
 *   affiliateId: 'affiliate-123',
 *   roleId: 'role-789'
 * })
 */
export async function inviteAffiliate(
  data: InviteAffiliateRequest,
  options?: RequestInit
): Promise<InviteAffiliateResponse> {
  return fetchAPI<InviteAffiliateResponse>('/api/invitations/affiliate', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * Invite multiple affiliates in bulk
 *
 * Creates invitations for multiple affiliates at once.
 * Returns results for each affiliate (success or failure reason).
 *
 * @param data - Bulk invitation data (array of affiliate IDs + roleId)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Bulk result with success/failure counts and individual results
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * const result = await inviteAffiliatesBulk({
 *   affiliateIds: ['affiliate-1', 'affiliate-2', 'affiliate-3'],
 *   roleId: 'role-789'
 * })
 * // Returns: { total: 3, successCount: 2, failedCount: 1, results: [...] }
 */
export async function inviteAffiliatesBulk(
  data: InviteAffiliatesBulkRequest,
  options?: RequestInit
): Promise<InviteAffiliatesBulkResponse> {
  return fetchAPI<InviteAffiliatesBulkResponse>('/api/invitations/affiliates/bulk', {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * Get affiliates that can be invited
 *
 * Returns affiliates that:
 * - Have an email
 * - Don't have a user account yet
 * - Are active
 * - Don't have a pending invitation
 *
 * @param params - Optional query parameters for filtering and pagination
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Paginated invitable affiliates list
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * // Get first page with defaults
 * const response = await getInvitableAffiliates()
 *
 * @example
 * // Filter by client
 * const response = await getInvitableAffiliates({ clientId: 'client-123' })
 *
 * @example
 * // Search by name or document
 * const response = await getInvitableAffiliates({ search: 'Juan' })
 */
export async function getInvitableAffiliates(
  params?: {
    clientId?: string
    search?: string
    page?: number
    limit?: number
  },
  options?: RequestInit
): Promise<GetInvitableAffiliatesResponse> {
  const searchParams = new URLSearchParams()

  if (params?.clientId) {
    searchParams.append('clientId', params.clientId)
  }
  if (params?.search) {
    searchParams.append('search', params.search)
  }
  if (params?.page !== undefined) {
    searchParams.append('page', params.page.toString())
  }
  if (params?.limit !== undefined) {
    searchParams.append('limit', params.limit.toString())
  }

  const queryString = searchParams.toString()
  const endpoint = `/api/affiliates/invitable${queryString ? `?${queryString}` : ''}`

  return fetchAPI<GetInvitableAffiliatesResponse>(endpoint, options)
}
