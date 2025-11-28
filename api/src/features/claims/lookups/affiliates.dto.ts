/**
 * affiliates.dto.ts
 * DTOs for claims available affiliates lookup
 */

/**
 * Available affiliate for claim creation dropdown
 */
export interface AvailableAffiliateResponse {
  id: string
  firstName: string
  lastName: string
  coverageType: string | null
}
