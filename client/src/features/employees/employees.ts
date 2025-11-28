/**
 * Employees type definitions
 * Mirrors backend DTOs from api/src/features/employees/
 */

import type { PaginationMetadata } from '../../shared/types/common'

// Re-export for convenience
export type { PaginationMetadata }

/**
 * Single employee item in list view
 * Mirrors: api/src/features/employees/views/viewEmployees.dto.ts
 */
export interface EmployeeListItemResponse {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  position: string | null
  department: string | null
  employeeCode: string | null
  userId: string | null
  hasUserAccount: boolean
  isActive: boolean
  createdAt: string
}

/**
 * Response from GET /api/employees
 * Mirrors: api/src/features/employees/views/viewEmployees.dto.ts
 */
export interface GetEmployeesResponse {
  employees: EmployeeListItemResponse[]
  pagination: PaginationMetadata
}

/**
 * Complete employee detail (same as list item for now)
 * Used for GET /api/employees/:id
 */
export interface EmployeeDetailResponse {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  position: string | null
  department: string | null
  employeeCode: string | null
  userId: string | null
  hasUserAccount: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Update employee request body
 * Mirrors: api/src/features/employees/edit/editEmployee.dto.ts
 * Sent to PATCH /api/employees/:id
 */
export interface UpdateEmployeeRequest {
  firstName?: string
  lastName?: string
  phone?: string | null
  position?: string | null
  department?: string | null
  employeeCode?: string | null
  isActive?: boolean
}

/**
 * Update employee response
 * Mirrors: api/src/features/employees/edit/editEmployee.dto.ts
 * Returned from PATCH /api/employees/:id
 */
export interface UpdateEmployeeResponse {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  position: string | null
  department: string | null
  employeeCode: string | null
  isActive: boolean
  message: string
}
