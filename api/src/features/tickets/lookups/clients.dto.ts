/**
 * DTOs for available clients lookup (GET /api/tickets/available-clients)
 */

/**
 * Response item for available clients
 *
 * Used in dropdown for ticket creation.
 */
export interface AvailableClientResponse {
  /** Client ID (CUID) */
  id: string

  /** Client name */
  name: string
}
