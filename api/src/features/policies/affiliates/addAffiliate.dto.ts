/**
 * DTOs for creating and adding an affiliate to a policy
 */

import type { AffiliateType, CoverageType } from './policyAffiliates.dto.js'

/**
 * Request body for POST /api/policies/:policyId/affiliates
 *
 * Creates a new affiliate and automatically adds them to the policy.
 * Combines affiliate creation with policy enrollment in a single operation.
 */
export interface AddAffiliateToPolicyRequest {
  /**
   * Client ID (must match the policy's client)
   * Ensures affiliate belongs to same company as the policy
   */
  clientId: string

  /**
   * Affiliate's first name
   * Required for identification
   */
  firstName: string

  /**
   * Affiliate's last name
   * Required for identification
   */
  lastName: string

  /**
   * Affiliate type
   * OWNER: Primary policyholder (requires email)
   * DEPENDENT: Family member (requires primaryAffiliateId)
   */
  affiliateType: AffiliateType

  /**
   * Email address
   * Required for OWNER, optional for DEPENDENT
   * Used for account access and notifications
   */
  email?: string

  /**
   * Phone number
   * Optional contact information
   */
  phone?: string

  /**
   * Date of birth (ISO 8601 date format: YYYY-MM-DD)
   * Optional but useful for age-based validations
   */
  dateOfBirth?: string

  /**
   * Document type (e.g., DNI, Passport)
   * Optional identification
   */
  documentType?: string

  /**
   * Document number
   * Optional identification
   */
  documentNumber?: string

  /**
   * Coverage type
   * T: Titular only
   * TPLUS1: Titular + 1 dependent
   * TPLUSF: Titular + family
   */
  coverageType?: CoverageType

  /**
   * Primary affiliate ID (for DEPENDENT type)
   * Required when affiliateType is DEPENDENT
   * Must be an existing OWNER from the same client
   */
  primaryAffiliateId?: string

  /**
   * Date when the affiliate joins the policy (ISO 8601 format)
   * Optional - defaults to current timestamp if not provided
   * Cannot be in the future
   * Used for pro-rata billing calculations
   */
  addedAt?: string
}

/**
 * Response for successfully creating and adding an affiliate to a policy
 *
 * Returns the created affiliate information plus policy relationship details.
 * Follows the CreateAffiliateResponse pattern with additional policy confirmation.
 */
export interface AddAffiliateToPolicyResponse {
  // ============================================================================
  // AFFILIATE FIELDS (matching CreateAffiliateResponse)
  // ============================================================================

  // Core identification
  id: string
  firstName: string
  lastName: string

  // Contact info
  email: string | null
  phone: string | null

  // Personal info
  dateOfBirth: string | null // "YYYY-MM-DD" format
  documentType: string | null
  documentNumber: string | null

  // Type & coverage
  affiliateType: AffiliateType
  coverageType: CoverageType | null

  // Client relationship
  clientId: string
  clientName: string

  // Primary affiliate (for dependents)
  primaryAffiliateId: string | null
  primaryAffiliateFirstName: string | null
  primaryAffiliateLastName: string | null

  // Status
  hasUserAccount: boolean
  isActive: boolean

  // Timestamps
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601

  // ============================================================================
  // POLICY RELATIONSHIP FIELDS
  // ============================================================================

  /**
   * ID of the policy the affiliate was added to
   * Confirms the relationship was established
   */
  policyId: string

  /**
   * Policy number for display
   * Useful for confirmation messages
   */
  policyNumber: string

  /**
   * Date when the affiliate joined the policy
   * Used for pro-rata billing calculations
   */
  addedAt: string

  /**
   * Date when the affiliate was removed from the policy
   * Will be null for newly added affiliates
   */
  removedAt: string | null

  /**
   * Whether the PolicyAffiliate relationship is currently active
   * Will be true for newly created affiliates
   */
  relationshipIsActive: boolean
}