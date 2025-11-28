/**
 * DTOs for viewing/listing users
 */

/**
 * User type derived from linked entity
 */
export type UserType = 'EMPLOYEE' | 'AGENT' | 'AFFILIATE' | 'SYSTEM'

/**
 * Query parameters for GET /api/users
 */
export interface GetUsersQueryParams {
  /** Search by email or name (case-insensitive, partial match) */
  search?: string
  /** Filter by user type */
  type?: UserType
  /** Filter by role ID */
  roleId?: string
  /** Filter by active status (undefined = all) */
  isActive?: boolean
  /** Page number (>= 1, default: 1) */
  page?: number
  /** Items per page (1-100, default: 20) */
  limit?: number
}

/**
 * Single user item in list view
 */
export interface UserListItemResponse {
  // Core identification
  id: string
  email: string
  name: string | null

  // User type (derived from linked entity)
  type: UserType

  // Entity ID (Employee, Agent, or Affiliate)
  entityId: string | null

  // Role info (flat)
  globalRoleId: string | null
  globalRoleName: string | null

  // Client access count (for CLIENT_ADMIN affiliates)
  clientAccessCount: number

  // Status
  isActive: boolean

  // Dates (ISO strings)
  createdAt: string
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  /** Total number of users matching filters */
  total: number
  /** Current page number */
  page: number
  /** Items per page */
  limit: number
  /** Total number of pages */
  totalPages: number
  /** Whether there are more pages */
  hasMore: boolean
}

/**
 * Response from GET /api/users
 */
export interface GetUsersResponse {
  /** Array of user summaries */
  users: UserListItemResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata
}
