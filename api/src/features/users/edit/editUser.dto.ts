/**
 * DTOs for editing users
 */

/**
 * Request DTO - What client sends to edit a user
 */
export interface EditUserRequest {
  /** New global role ID (optional) */
  globalRoleId?: string
  /** New name (optional) */
  name?: string
}

/**
 * Response DTO - What API returns after editing a user
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
 * Request DTO - What client sends to update client access
 */
export interface UpdateClientAccessRequest {
  /** Array of client IDs to grant access to */
  clientIds: string[]
}

/**
 * Response DTO - What API returns after updating client access
 */
export interface UpdateClientAccessResponse {
  userId: string
  clientAccessCount: number
  clientIds: string[]
  message: string
}

/**
 * Response DTO - What API returns after deactivating a user
 */
export interface DeactivateUserResponse {
  id: string
  email: string
  deactivatedEntityType: string | null
  deactivatedEntityId: string | null
  sessionsDeleted: number
  message: string
}
