/**
 * Invitation type definitions
 * Mirrors backend DTOs from api/src/features/invitations/
 */

import type { PaginationMetadata } from '../../../shared/types/common'

// Re-export for convenience
export type { PaginationMetadata }

/**
 * Invitation type enum
 */
export type InvitationType = 'EMPLOYEE' | 'AGENT' | 'AFFILIATE'

/**
 * Invitation status enum
 */
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'

/**
 * Single invitation item in list view
 * Mirrors: api/src/features/invitations/views/viewInvitations.dto.ts
 */
export interface InvitationListItemResponse {
  id: string
  email: string
  token: string
  type: InvitationType
  status: InvitationStatus
  roleId: string
  roleName: string
  name: string | null
  affiliateId: string | null
  createdById: string
  createdByName: string | null
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
}

/**
 * Response from GET /api/invitations
 */
export interface GetInvitationsResponse {
  invitations: InvitationListItemResponse[]
  pagination: PaginationMetadata
}

/**
 * Validate invitation response (public endpoint)
 * Mirrors: api/src/features/invitations/validate/validateInvitation.dto.ts
 */
export interface ValidateInvitationResponse {
  valid: boolean
  email: string | null
  type: InvitationType | null
  name: string | null
  expiresAt: string | null
  reason: string | null
}

/**
 * Accept invitation response
 * Mirrors: api/src/features/invitations/accept/acceptInvitation.dto.ts
 */
export interface AcceptInvitationResponse {
  success: boolean
  user: {
    id: string
    email: string
    name: string | null
    globalRoleId: string
    globalRoleName: string
  }
  type: InvitationType
  entityId: string
  message: string
}

/**
 * Invite employee request
 * Mirrors: api/src/features/invitations/new/inviteEmployee.schema.ts
 */
export interface InviteEmployeeRequest {
  email: string
  firstName: string
  lastName: string
  phone?: string
  position?: string
  department?: string
  employeeCode?: string
  roleId: string
}

/**
 * Invite employee response
 */
export interface InviteEmployeeResponse {
  id: string
  email: string
  token: string
  type: InvitationType
  status: InvitationStatus
  roleId: string
  roleName: string
  entityData: {
    firstName: string
    lastName: string
    phone: string | null
    position: string | null
    department: string | null
    employeeCode: string | null
  }
  createdById: string
  createdByName: string | null
  expiresAt: string
  createdAt: string
}

/**
 * Invite agent request
 */
export interface InviteAgentRequest {
  email: string
  firstName: string
  lastName: string
  phone?: string
  agentCode?: string
  roleId: string
}

/**
 * Invite agent response
 */
export interface InviteAgentResponse {
  id: string
  email: string
  token: string
  type: InvitationType
  status: InvitationStatus
  roleId: string
  roleName: string
  entityData: {
    firstName: string
    lastName: string
    phone: string | null
    agentCode: string | null
  }
  createdById: string
  createdByName: string | null
  expiresAt: string
  createdAt: string
}

/**
 * Invite affiliate request
 */
export interface InviteAffiliateRequest {
  affiliateId: string
  roleId: string
}

/**
 * Invite affiliate response
 */
export interface InviteAffiliateResponse {
  id: string
  email: string
  token: string
  type: InvitationType
  status: InvitationStatus
  roleId: string
  roleName: string
  affiliateId: string
  affiliateFirstName: string
  affiliateLastName: string
  createdById: string
  createdByName: string | null
  expiresAt: string
  createdAt: string
}

/**
 * Bulk invite affiliates request
 */
export interface InviteAffiliatesBulkRequest {
  affiliateIds: string[]
  roleId: string
}

/**
 * Single result in bulk invite response
 */
export interface BulkInviteResult {
  affiliateId: string
  success: boolean
  invitationId: string | null
  reason: string | null
}

/**
 * Bulk invite affiliates response
 */
export interface InviteAffiliatesBulkResponse {
  total: number
  successCount: number
  failedCount: number
  results: BulkInviteResult[]
}

/**
 * Resend invitation response
 */
export interface ResendInvitationResponse {
  id: string
  email: string
  type: InvitationType
  status: InvitationStatus
  expiresAt: string
  message: string
}

/**
 * Revoke invitation response
 */
export interface RevokeInvitationResponse {
  id: string
  email: string
  type: InvitationType
  status: InvitationStatus
  message: string
}

/**
 * Invitable affiliate (for affiliate invitation selection)
 */
export interface InvitableAffiliateResponse {
  id: string
  firstName: string
  lastName: string
  email: string
  documentNumber: string | null
  clientId: string
  clientName: string
}

/**
 * Response from GET /api/affiliates/invitable
 */
export interface GetInvitableAffiliatesResponse {
  affiliates: InvitableAffiliateResponse[]
  pagination: PaginationMetadata
}
