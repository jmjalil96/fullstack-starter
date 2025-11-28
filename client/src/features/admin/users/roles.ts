/**
 * Role types for admin users feature
 * Mirrors: api/src/features/roles/views/viewRoles.dto.ts
 */

/**
 * Single role item in list view
 */
export interface RoleListItemResponse {
  id: string
  name: string
  description: string | null
}

/**
 * Response from GET /api/roles
 */
export interface GetRolesResponse {
  roles: RoleListItemResponse[]
}
