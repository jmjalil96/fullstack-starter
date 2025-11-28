/**
 * Roles API service layer
 * Type-safe wrappers around fetchAPI for roles endpoints
 */

import { fetchAPI } from '../../../config/api'

import type { GetRolesResponse } from './roles'

/**
 * Get list of all active roles
 *
 * Returns roles for use in dropdowns and selectors.
 * Requires BROKER_EMPLOYEES role.
 *
 * @param options - Optional RequestInit options (e.g., signal for AbortController)
 * @returns List of active roles
 * @throws {ApiRequestError} If request fails
 *
 * @example
 * // Get all roles
 * const response = await getRoles()
 * // Returns: { roles: [{ id: '...', name: 'SUPER_ADMIN', description: '...' }, ...] }
 *
 * @example
 * // With AbortController
 * const controller = new AbortController()
 * const response = await getRoles({ signal: controller.signal })
 */
export async function getRoles(options?: RequestInit): Promise<GetRolesResponse> {
  return fetchAPI<GetRolesResponse>('/api/roles', options)
}
