/**
 * DTO for available owners endpoint
 */

/**
 * Available owners response (for primary affiliate selection)
 */
export interface AvailableOwnerResponse {
  id: string
  firstName: string
  lastName: string
  email: string | null
  documentNumber: string | null
}
