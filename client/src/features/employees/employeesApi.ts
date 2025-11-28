/**
 * Employees API service layer
 * Type-safe wrappers around fetchAPI for employees endpoints
 */

import { fetchAPI } from '../../config/api'

import type {
  EmployeeDetailResponse,
  GetEmployeesResponse,
  UpdateEmployeeRequest,
  UpdateEmployeeResponse,
} from './employees'

/**
 * Get paginated list of employees with optional filters
 *
 * @param params - Optional query parameters for filtering and pagination
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Paginated employees list with metadata
 * @throws {ApiRequestError} If request fails
 */
export async function getEmployees(
  params?: {
    search?: string
    department?: string
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
 * Get complete employee detail by ID
 *
 * @param employeeId - Employee ID to fetch (CUID)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Complete employee data with all fields
 * @throws {ApiRequestError} If request fails (404 if not found)
 */
export async function getEmployeeById(
  employeeId: string,
  options?: RequestInit
): Promise<EmployeeDetailResponse> {
  return fetchAPI<EmployeeDetailResponse>(`/api/employees/${employeeId}`, options)
}

/**
 * Update an existing employee (partial update)
 *
 * @param employeeId - Employee ID to update (CUID)
 * @param updates - Partial employee updates (all fields optional)
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns Updated employee with all fields
 * @throws {ApiRequestError} If request fails (400, 403, 404)
 */
export async function updateEmployee(
  employeeId: string,
  updates: UpdateEmployeeRequest,
  options?: RequestInit
): Promise<UpdateEmployeeResponse> {
  // Filter out undefined values (fields not changed)
  // Keep null values (intentional field clearing)
  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  )

  return fetchAPI<UpdateEmployeeResponse>(`/api/employees/${employeeId}`, {
    method: 'PATCH',
    body: JSON.stringify(cleanedUpdates),
    ...options,
  })
}
