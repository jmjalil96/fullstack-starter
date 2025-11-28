/**
 * DTOs for inviting employees
 */

import { InvitationStatus, InvitationType } from '@prisma/client'

/**
 * Request DTO - What client sends to invite an employee
 */
export interface InviteEmployeeRequest {
  /** Email address for the invitation */
  email: string

  /** Employee's first name */
  firstName: string

  /** Employee's last name */
  lastName: string

  /** Employee's phone number (optional) */
  phone?: string

  /** Job position/title (optional) */
  position?: string

  /** Department (optional) */
  department?: string

  /** Employee code/ID (optional, must be unique if provided) */
  employeeCode?: string

  /** Role ID to assign upon acceptance */
  roleId: string
}

/**
 * Response DTO - What API returns after creating invitation
 */
export interface InviteEmployeeResponse {
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

  // Entity data (stored for employee creation on acceptance)
  entityData: {
    firstName: string
    lastName: string
    phone: string | null
    position: string | null
    department: string | null
    employeeCode: string | null
  }

  // Creator info (flat)
  createdById: string
  createdByName: string | null

  // Dates (ISO strings)
  expiresAt: string
  createdAt: string
}
