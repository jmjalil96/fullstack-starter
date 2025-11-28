/**
 * DTOs for viewing/listing invitations
 */

import { InvitationStatus, InvitationType } from '@prisma/client'

/**
 * Query parameters for GET /api/invitations
 */
export interface GetInvitationsQueryParams {
  /** Filter by invitation status (default: PENDING) */
  status?: InvitationStatus
  /** Filter by invitation type */
  type?: InvitationType
  /** Search by email or name (case-insensitive, partial match) */
  search?: string
  /** Page number (>= 1, default: 1) */
  page?: number
  /** Items per page (1-100, default: 20) */
  limit?: number
}

/**
 * Single invitation item in list view
 * Flat structure with all Invitation model fields plus flattened relations
 */
export interface InvitationListItemResponse {
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

  // Entity info (from entityData or affiliate)
  name: string | null

  // For AFFILIATE type only
  affiliateId: string | null

  // Creator info (flat)
  createdById: string
  createdByName: string | null

  // Dates (ISO strings)
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  /** Total number of invitations matching filters */
  total: number
  /** Current page number */
  page: number
  /** Items per page */
  limit: number
  /** Total number of pages */
  totalPages: number
  /** Whether there are more pages */
  hasMore: boolean
}

/**
 * Response from GET /api/invitations
 * Returns paginated list of invitations with metadata
 */
export interface GetInvitationsResponse {
  /** Array of invitation summaries */
  invitations: InvitationListItemResponse[]
  /** Pagination metadata */
  pagination: PaginationMetadata
}
