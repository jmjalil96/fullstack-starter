/**
 * patients.dto.ts
 * DTOs for claims available patients lookup
 */

/**
 * Available patient for claim creation dropdown
 * Patient is either the affiliate themselves (self) or a dependent
 */
export interface AvailablePatientResponse {
  id: string
  firstName: string
  lastName: string
  relationship: 'self' | 'dependent'
}
