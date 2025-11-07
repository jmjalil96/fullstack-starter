/**
 * Claim role constants
 *
 * Centralized role definitions for claim permissions.
 * Single source of truth to prevent duplication across services.
 *
 * Used by:
 * - Lifecycle blueprint (edit permissions per status)
 * - Service layer authorization
 * - Future: Can refactor existing services to use these constants
 */

/**
 * Broker employees who can VIEW claims (read-only access)
 *
 * Permissions:
 * - View all claims across all clients
 * - Access claim reports and analytics
 * - NO creation or editing permissions (senior managers only)
 *
 * Used in: Authorization checks for claim viewing
 */
export const BROKER_EMPLOYEES = [
  'SUPER_ADMIN',
  'CLAIMS_EMPLOYEE',
  'OPERATIONS_EMPLOYEE',
  'ADMIN_EMPLOYEE',
] as const

/**
 * Senior claim managers with full claim management privileges
 *
 * Permissions:
 * - All broker employee permissions (viewing)
 * - CREATE new claims for any client
 * - EDIT claims in SUBMITTED and UNDER_REVIEW states
 * - Approve/reject claims (transition to APPROVED/REJECTED)
 * - Manage claim lifecycle transitions
 *
 * Used in: newClaim.service, claimEdit.service, claimLifecycle.blueprint
 */
export const SENIOR_CLAIM_MANAGERS = [
  'SUPER_ADMIN',
  'CLAIMS_EMPLOYEE',
] as const

/**
 * Super admin only - highest privilege level
 *
 * Permissions:
 * - All senior manager permissions
 * - Access terminal states (APPROVED/REJECTED) for future features
 * - Unrestricted access to all claim operations
 *
 * Used in: claimEdit.service (terminal states)
 */
export const SUPER_ADMIN_ONLY = [
  'SUPER_ADMIN',
] as const

/**
 * All roles that can view and interact with claims
 *
 * Includes:
 * - Broker employees (can manage claims)
 * - Client admins (can view their clients' claims)
 * - Affiliates (can view and create their own claims)
 *
 * Used in: Authorization checks for claim viewing and listing
 */
export const ALL_CLAIM_ROLES = [
  'SUPER_ADMIN',
  'CLAIMS_EMPLOYEE',
  'OPERATIONS_EMPLOYEE',
  'ADMIN_EMPLOYEE',
  'CLIENT_ADMIN',
  'AFFILIATE',
] as const

/**
 * Type definitions for type-safe role checking
 */
export type BrokerEmployeeRole = typeof BROKER_EMPLOYEES[number]
export type SeniorClaimManagerRole = typeof SENIOR_CLAIM_MANAGERS[number]
export type SuperAdminRole = typeof SUPER_ADMIN_ONLY[number]
export type ClaimRole = typeof ALL_CLAIM_ROLES[number]
