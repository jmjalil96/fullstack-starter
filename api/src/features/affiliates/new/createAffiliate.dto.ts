/**
 * DTOs for creating affiliates
 */

/**
 * Request DTO - What client sends
 */
export interface CreateAffiliateRequest {
  /** Client ID (company this affiliate belongs to) */
  clientId: string

  /** Affiliate first name */
  firstName: string

  /** Affiliate last name */
  lastName: string

  /** Affiliate email address (required for OWNER, optional for DEPENDENT) */
  email?: string

  /** Contact phone number (optional) */
  phone?: string

  /** Date of birth (optional) */
  dateOfBirth?: string // Will be Date object after Zod coercion

  /** Document type (e.g., DNI, Passport) (optional) */
  documentType?: string

  /** Document number (optional) */
  documentNumber?: string

  /** Affiliate type - OWNER or DEPENDENT */
  affiliateType: 'OWNER' | 'DEPENDENT'

  /** Coverage type - T (titular), TPLUS1, or TPLUSF (optional) */
  coverageType?: 'T' | 'TPLUS1' | 'TPLUSF'

  /** Primary affiliate ID (required for DEPENDENT type) (optional) */
  primaryAffiliateId?: string
}

/**
 * Response DTO - What API returns after creation
 */
export interface CreateAffiliateResponse {
  id: string

  /** Personal information */
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  dateOfBirth: string | null // "2024-01-01" format
  documentType: string | null
  documentNumber: string | null

  /** Affiliate classification */
  affiliateType: 'OWNER' | 'DEPENDENT'
  coverageType: 'T' | 'TPLUS1' | 'TPLUSF' | null

  /** Client relationship */
  clientId: string
  clientName: string

  /** Primary affiliate relationship (for dependents) */
  primaryAffiliateId: string | null
  primaryAffiliateFirstName: string | null
  primaryAffiliateLastName: string | null

  /** Account status */
  hasUserAccount: boolean
  isActive: boolean

  /** Timestamps */
  createdAt: string
  updatedAt: string
}
