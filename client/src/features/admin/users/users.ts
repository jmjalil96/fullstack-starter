/**
 * User type definitions
 * Mirrors backend DTOs from api/src/features/users/
 */

import type { PaginationMetadata } from '../../../shared/types/common'

// Re-export for convenience
export type { PaginationMetadata }

/**
 * User type (derived from linked entity)
 */
export type UserType = 'EMPLOYEE' | 'AGENT' | 'AFFILIATE' | 'SYSTEM'

/**
 * Single user item in list view
 * Mirrors: api/src/features/users/views/viewUsers.dto.ts
 */
export interface UserListItemResponse {
  id: string
  email: string
  name: string | null
  type: UserType
  entityId: string | null
  globalRoleId: string | null
  globalRoleName: string | null
  clientAccessCount: number
  isActive: boolean
  createdAt: string
}

/**
 * Response from GET /api/users
 */
export interface GetUsersResponse {
  users: UserListItemResponse[]
  pagination: PaginationMetadata
}

/**
 * Edit user request
 */
export interface EditUserRequest {
  globalRoleId?: string
  name?: string
}

/**
 * Edit user response
 */
export interface EditUserResponse {
  id: string
  email: string
  name: string | null
  globalRoleId: string | null
  globalRoleName: string | null
  message: string
}

/**
 * Update client access request
 */
export interface UpdateClientAccessRequest {
  clientIds: string[]
}

/**
 * Update client access response
 */
export interface UpdateClientAccessResponse {
  userId: string
  clientAccessCount: number
  clientIds: string[]
  message: string
}

/**
 * Deactivate user response
 */
export interface DeactivateUserResponse {
  id: string
  email: string
  deactivatedEntityType: string | null
  deactivatedEntityId: string | null
  sessionsDeleted: number
  message: string
}

/**
 * Employee list item
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
 */
export interface GetEmployeesResponse {
  employees: EmployeeListItemResponse[]
  pagination: PaginationMetadata
}

/**
 * Edit employee request
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
 * Edit employee response
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

/**
 * Agent list item
 */
export interface AgentListItemResponse {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  agentCode: string | null
  userId: string | null
  hasUserAccount: boolean
  isActive: boolean
  createdAt: string
}

/**
 * Response from GET /api/agents
 */
export interface GetAgentsResponse {
  agents: AgentListItemResponse[]
  pagination: PaginationMetadata
}

/**
 * Edit agent request
 */
export interface EditAgentRequest {
  firstName?: string
  lastName?: string
  phone?: string | null
  agentCode?: string | null
}

/**
 * Edit agent response
 */
export interface EditAgentResponse {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  agentCode: string | null
  isActive: boolean
  message: string
}
