/**
 * DTO for available policies endpoint
 */

/**
 * Available policies response (for picklist/dropdown)
 */
export interface AvailablePolicyResponse {
  id: string
  policyNumber: string
  type: string | null
  startDate: string
  endDate: string
}
