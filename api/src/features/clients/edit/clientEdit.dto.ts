/**
 * DTOs for client editing endpoint (PUT /api/clients/:id)
 *
 * Defines the request and response types for updating clients.
 * Much simpler than claims - no lifecycle rules, all fields editable anytime.
 */

import type { ClientDetailResponse } from '../views/clientDetail.dto.js'

/**
 * Request body for updating a client
 *
 * All fields are optional (partial update pattern).
 * Fields marked as nullable can be explicitly set to null to clear them.
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES can edit clients
 * - CLIENT_ADMIN and AFFILIATE have read-only access
 *
 * Validation:
 * - taxId must be unique if changed
 * - At least one field must be provided (reject empty updates)
 *
 * @example
 * // Simple update
 * {
 *   "name": "Updated Company Name",
 *   "email": "newemail@company.com"
 * }
 *
 * @example
 * // Clear optional field by setting to null
 * {
 *   "phone": null,
 *   "address": null
 * }
 *
 * @example
 * // Deactivate client
 * {
 *   "isActive": false
 * }
 */
export interface UpdateClientRequest {
  /** Client company name (2-200 chars) */
  name?: string

  /** Tax identification number (8-20 digits, unique) */
  taxId?: string

  /** Primary contact email (can be null to clear) */
  email?: string | null

  /** Primary contact phone (can be null to clear) */
  phone?: string | null

  /** Business address (can be null to clear) */
  address?: string | null

  /** Whether client is active */
  isActive?: boolean
}

/**
 * Response from PUT /api/clients/:id
 *
 * Returns complete updated client with all fields (same structure as detail view).
 * Client receives full client state after update for consistency.
 */
export type UpdateClientResponse = ClientDetailResponse
