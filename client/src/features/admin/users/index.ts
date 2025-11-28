/**
 * Admin Users feature exports
 * Note: Employees and Agents have their own dedicated feature directories
 */

// Components
export { InvitationsList } from './components/InvitationsList'
export { InviteUserModal } from './components/InviteUserModal'
export { UsersList } from './components/UsersList'
export { UsersPage } from './components/UsersPage'

// Hooks
export { useInvitations, useInvitableAffiliates, useValidateInvitation } from './hooks/useInvitations'
export {
  useAcceptInvitation,
  useInviteAffiliate,
  useInviteAffiliatesBulk,
  useInviteAgent,
  useInviteEmployee,
  useResendInvitation,
  useRevokeInvitation,
} from './hooks/useInvitationMutations'
export { useAgents, useEmployees, useUsers } from './hooks/useUsers'
export {
  useDeactivateUser,
  useEditAgent,
  useEditEmployee,
  useEditUser,
  useUpdateClientAccess,
} from './hooks/useUserMutations'

// Types
export type {
  AcceptInvitationResponse,
  GetInvitableAffiliatesResponse,
  GetInvitationsResponse,
  InvitableAffiliateResponse,
  InvitationListItemResponse,
  InvitationStatus,
  InvitationType,
  InviteAffiliateRequest,
  InviteAffiliateResponse,
  InviteAffiliatesBulkRequest,
  InviteAffiliatesBulkResponse,
  InviteAgentRequest,
  InviteAgentResponse,
  InviteEmployeeRequest,
  InviteEmployeeResponse,
  ResendInvitationResponse,
  RevokeInvitationResponse,
  ValidateInvitationResponse,
} from './invitations'

export type {
  AgentListItemResponse,
  DeactivateUserResponse,
  EditAgentRequest,
  EditAgentResponse,
  EditEmployeeRequest,
  EditEmployeeResponse,
  EditUserRequest,
  EditUserResponse,
  EmployeeListItemResponse,
  GetAgentsResponse,
  GetEmployeesResponse,
  GetUsersResponse,
  UpdateClientAccessRequest,
  UpdateClientAccessResponse,
  UserListItemResponse,
  UserType,
} from './users'
