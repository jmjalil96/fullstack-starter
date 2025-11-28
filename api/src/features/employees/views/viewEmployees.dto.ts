/**
 * DTOs for viewing/listing employees
 */

/**
 * Query parameters for GET /api/employees
 */
export interface GetEmployeesQueryParams {
  /** Search by name, email, or employee code */
  search?: string
  /** Filter by department */
  department?: string
  /** Filter by active status */
  isActive?: boolean
  /** Page number (>= 1, default: 1) */
  page?: number
  /** Items per page (1-100, default: 20) */
  limit?: number
}

/**
 * Single employee item in list view
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
 * Pagination metadata
 */
export interface PaginationMetadata {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

/**
 * Response from GET /api/employees
 */
export interface GetEmployeesResponse {
  employees: EmployeeListItemResponse[]
  pagination: PaginationMetadata
}
