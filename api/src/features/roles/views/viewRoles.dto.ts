/**
 * DTOs for viewing/listing roles
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
