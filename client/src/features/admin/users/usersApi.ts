/**
 * Users API service layer
 * Type-safe wrappers around fetchAPI for users endpoints
 */

import { fetchAPI } from '../../../config/api'

import type {
  DeactivateUserResponse,
  EditAgentRequest,
  EditAgentResponse,
  EditEmployeeRequest,
  EditEmployeeResponse,
  EditUserRequest,
  EditUserResponse,
  GetAgentsResponse,
  GetEmployeesResponse,
  GetUsersResponse,
  UpdateClientAccessRequest,
  UpdateClientAccessResponse,
  UserType,
} from './users'

/**
 * Get paginated list of users with optional filters
 *
 * Returns users based on requesting user's role.
 * Backend applies defaults: page=1, limit=20
 *
 * @param params - Optional query parameters for filtering and pagination
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Paginated users list with metadata
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * // Get first page with defaults
 * const response = await getUsers()
 * // Returns: { users: [...], pagination: { total, page: 1, limit: 20, ... } }
 *
 * @example
 * // Filter by type
 * const response = await getUsers({ type: 'EMPLOYEE' })
 *
 * @example
 * // Search by email or name
 * const response = await getUsers({ search: 'juan' })
 *
 * @example
 * // Filter active only
 * const response = await getUsers({ isActive: true })
 *
 * @example
 * // With pagination
 * const response = await getUsers({ page: 2, limit: 10 })
 */
export async function getUsers(
  params?: {
    type?: UserType
    search?: string
    isActive?: boolean
    page?: number
    limit?: number
  },
  options?: RequestInit
): Promise<GetUsersResponse> {
  const searchParams = new URLSearchParams()

  if (params?.type) {
    searchParams.append('type', params.type)
  }
  if (params?.search) {
    searchParams.append('search', params.search)
  }
  if (params?.isActive !== undefined) {
    searchParams.append('isActive', params.isActive.toString())
  }
  if (params?.page !== undefined) {
    searchParams.append('page', params.page.toString())
  }
  if (params?.limit !== undefined) {
    searchParams.append('limit', params.limit.toString())
  }

  const queryString = searchParams.toString()
  const endpoint = `/api/users${queryString ? `?${queryString}` : ''}`

  return fetchAPI<GetUsersResponse>(endpoint, options)
}

/**
 * Update a user's global role or name
 *
 * Only SUPER_ADMIN can edit user roles.
 *
 * @param userId - User ID to update (CUID)
 * @param updates - Partial user updates
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Updated user details
 * @throws {ApiRequestError} If request fails (400, 403, 404)
 *
 * @example
 * const result = await editUser('user-123', { globalRoleId: 'role-456' })
 * // Returns: { id: '...', email: '...', globalRoleName: 'Admin', message: '...' }
 *
 * @example
 * const result = await editUser('user-123', { name: 'Juan Carlos Pérez' })
 */
export async function editUser(
  userId: string,
  updates: EditUserRequest,
  options?: RequestInit
): Promise<EditUserResponse> {
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  )

  return fetchAPI<EditUserResponse>(`/api/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(cleanedUpdates),
    ...options,
  })
}

/**
 * Update a user's client access permissions
 *
 * Replaces all current client access with the new list.
 * Only BROKER_EMPLOYEES can have client access (not SUPER_ADMIN).
 *
 * @param userId - User ID to update (CUID)
 * @param clientIds - Array of client IDs to grant access to
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Updated client access details
 * @throws {ApiRequestError} If request fails (400, 403, 404)
 *
 * @example
 * const result = await updateClientAccess('user-123', {
 *   clientIds: ['client-1', 'client-2', 'client-3']
 * })
 * // Returns: { userId: '...', clientAccessCount: 3, clientIds: [...], message: '...' }
 *
 * @example
 * // Remove all client access
 * const result = await updateClientAccess('user-123', { clientIds: [] })
 */
export async function updateClientAccess(
  userId: string,
  data: UpdateClientAccessRequest,
  options?: RequestInit
): Promise<UpdateClientAccessResponse> {
  return fetchAPI<UpdateClientAccessResponse>(`/api/users/${userId}/client-access`, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  })
}

/**
 * Deactivate a user account
 *
 * Deactivates the user and their linked entity (Employee/Agent/Affiliate).
 * Also deletes all active sessions.
 *
 * @param userId - User ID to deactivate (CUID)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Deactivation details including sessions deleted
 * @throws {ApiRequestError} If request fails (400, 403, 404)
 *
 * @example
 * const result = await deactivateUser('user-123')
 * // Returns: { id: '...', deactivatedEntityType: 'EMPLOYEE', sessionsDeleted: 2, message: '...' }
 */
export async function deactivateUser(
  userId: string,
  options?: RequestInit
): Promise<DeactivateUserResponse> {
  return fetchAPI<DeactivateUserResponse>(`/api/users/${userId}/deactivate`, {
    method: 'POST',
    ...options,
  })
}

/**
 * Get paginated list of employees with optional filters
 *
 * @param params - Optional query parameters for filtering and pagination
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Paginated employees list with metadata
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * // Get first page with defaults
 * const response = await getEmployees()
 *
 * @example
 * // Search by name, email, or code
 * const response = await getEmployees({ search: 'juan' })
 *
 * @example
 * // Filter by department
 * const response = await getEmployees({ department: 'Engineering' })
 *
 * @example
 * // Filter with/without user accounts
 * const response = await getEmployees({ hasUserAccount: true })
 *
 * @example
 * // Filter active only
 * const response = await getEmployees({ isActive: true })
 */
export async function getEmployees(
  params?: {
    search?: string
    department?: string
    hasUserAccount?: boolean
    isActive?: boolean
    page?: number
    limit?: number
  },
  options?: RequestInit
): Promise<GetEmployeesResponse> {
  const searchParams = new URLSearchParams()

  if (params?.search) {
    searchParams.append('search', params.search)
  }
  if (params?.department) {
    searchParams.append('department', params.department)
  }
  if (params?.hasUserAccount !== undefined) {
    searchParams.append('hasUserAccount', params.hasUserAccount.toString())
  }
  if (params?.isActive !== undefined) {
    searchParams.append('isActive', params.isActive.toString())
  }
  if (params?.page !== undefined) {
    searchParams.append('page', params.page.toString())
  }
  if (params?.limit !== undefined) {
    searchParams.append('limit', params.limit.toString())
  }

  const queryString = searchParams.toString()
  const endpoint = `/api/employees${queryString ? `?${queryString}` : ''}`

  return fetchAPI<GetEmployeesResponse>(endpoint, options)
}

/**
 * Update an employee's information
 *
 * @param employeeId - Employee ID to update (CUID)
 * @param updates - Partial employee updates
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Updated employee details
 * @throws {ApiRequestError} If request fails (400, 403, 404, 409)
 *
 * @example
 * const result = await editEmployee('employee-123', {
 *   position: 'Senior Developer',
 *   department: 'Engineering'
 * })
 */
export async function editEmployee(
  employeeId: string,
  updates: EditEmployeeRequest,
  options?: RequestInit
): Promise<EditEmployeeResponse> {
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  )

  return fetchAPI<EditEmployeeResponse>(`/api/employees/${employeeId}`, {
    method: 'PATCH',
    body: JSON.stringify(cleanedUpdates),
    ...options,
  })
}

/**
 * Get paginated list of agents with optional filters
 *
 * @param params - Optional query parameters for filtering and pagination
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Paginated agents list with metadata
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * // Get first page with defaults
 * const response = await getAgents()
 *
 * @example
 * // Search by name, email, or code
 * const response = await getAgents({ search: 'maría' })
 *
 * @example
 * // Filter with/without user accounts
 * const response = await getAgents({ hasUserAccount: true })
 *
 * @example
 * // Filter active only
 * const response = await getAgents({ isActive: true })
 */
export async function getAgents(
  params?: {
    search?: string
    hasUserAccount?: boolean
    isActive?: boolean
    page?: number
    limit?: number
  },
  options?: RequestInit
): Promise<GetAgentsResponse> {
  const searchParams = new URLSearchParams()

  if (params?.search) {
    searchParams.append('search', params.search)
  }
  if (params?.hasUserAccount !== undefined) {
    searchParams.append('hasUserAccount', params.hasUserAccount.toString())
  }
  if (params?.isActive !== undefined) {
    searchParams.append('isActive', params.isActive.toString())
  }
  if (params?.page !== undefined) {
    searchParams.append('page', params.page.toString())
  }
  if (params?.limit !== undefined) {
    searchParams.append('limit', params.limit.toString())
  }

  const queryString = searchParams.toString()
  const endpoint = `/api/agents${queryString ? `?${queryString}` : ''}`

  return fetchAPI<GetAgentsResponse>(endpoint, options)
}

/**
 * Update an agent's information
 *
 * @param agentId - Agent ID to update (CUID)
 * @param updates - Partial agent updates
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Updated agent details
 * @throws {ApiRequestError} If request fails (400, 403, 404, 409)
 *
 * @example
 * const result = await editAgent('agent-123', {
 *   phone: '+51999888777',
 *   agentCode: 'AGT-002'
 * })
 */
export async function editAgent(
  agentId: string,
  updates: EditAgentRequest,
  options?: RequestInit
): Promise<EditAgentResponse> {
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  )

  return fetchAPI<EditAgentResponse>(`/api/agents/${agentId}`, {
    method: 'PATCH',
    body: JSON.stringify(cleanedUpdates),
    ...options,
  })
}
