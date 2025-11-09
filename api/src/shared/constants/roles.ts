/**
 * Role constants for authorization
 * Single source of truth for all role-based access control
 */

export const BROKER_EMPLOYEES = [
  'SUPER_ADMIN',
  'CLAIMS_EMPLOYEE',
  'OPERATIONS_EMPLOYEE',
  'ADMIN_EMPLOYEE',
] as const

export const SENIOR_CLAIM_MANAGERS = [
  'SUPER_ADMIN',
  'CLAIMS_EMPLOYEE',
] as const

export const SUPER_ADMIN_ONLY = ['SUPER_ADMIN'] as const

export const ALL_AUTHORIZED_ROLES = [
  'SUPER_ADMIN',
  'CLAIMS_EMPLOYEE',
  'OPERATIONS_EMPLOYEE',
  'ADMIN_EMPLOYEE',
  'CLIENT_ADMIN',
  'AFFILIATE',
] as const

export type BrokerEmployeeRole = typeof BROKER_EMPLOYEES[number]
export type SeniorClaimManagerRole = typeof SENIOR_CLAIM_MANAGERS[number]
export type SuperAdminRole = typeof SUPER_ADMIN_ONLY[number]
export type AuthorizedRole = typeof ALL_AUTHORIZED_ROLES[number]
