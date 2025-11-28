/**
 * DTOs for editing employees
 */

/**
 * Request DTO - What client sends to edit an employee
 */
export interface EditEmployeeRequest {
  firstName?: string
  lastName?: string
  phone?: string | null
  position?: string | null
  department?: string | null
  employeeCode?: string | null
}

/**
 * Response DTO - What API returns after editing an employee
 */
export interface EditEmployeeResponse {
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
