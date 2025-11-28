/**
 * DTOs for inviting affiliates
 */

import { InvitationStatus, InvitationType } from '@prisma/client'

/**
 * Request DTO - What client sends to invite an affiliate
 */
export interface InviteAffiliateRequest {
  /** Affiliate ID to invite */
  affiliateId: string

  /** Role ID to assign upon acceptance */
  roleId: string
}

/**
 * Response DTO - What API returns after creating invitation
 */
export interface InviteAffiliateResponse {
  // Core identification
  id: string
  email: string
  token: string

  // Invitation type and status
  type: InvitationType
  status: InvitationStatus

  // Role info (flat)
  roleId: string
  roleName: string

  // Affiliate info (flat)
  affiliateId: string
  affiliateFirstName: string
  affiliateLastName: string

  // Creator info (flat)
  createdById: string
  createdByName: string | null

  // Dates (ISO strings)
  expiresAt: string
  createdAt: string
}

/**
 * Request DTO - What client sends to bulk invite affiliates
 */
export interface InviteAffiliatesBulkRequest {
  /** Array of affiliate IDs to invite */
  affiliateIds: string[]

  /** Role ID to assign to all upon acceptance */
  roleId: string
}

/**
 * Single result in bulk invite response
 */
export interface BulkInviteResult {
  /** Affiliate ID that was processed */
  affiliateId: string

  /** Whether invitation was successful */
  success: boolean

  /** Invitation ID (only if success) */
  invitationId: string | null

  /** Error reason (only if failed) */
  reason: string | null
}

/**
 * Response DTO - What API returns after bulk inviting affiliates
 */
export interface InviteAffiliatesBulkResponse {
  /** Total affiliates processed */
  total: number

  /** Number of successful invitations */
  successCount: number

  /** Number of failed invitations */
  failedCount: number

  /** Individual results for each affiliate */
  results: BulkInviteResult[]
}
