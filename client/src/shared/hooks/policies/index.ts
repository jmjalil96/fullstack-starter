/**
 * Policies hooks - barrel export
 */

export { useAvailableClients } from './useAvailableClients'
export { useAvailableInsurers } from './useAvailableInsurers'
export { useCreatePolicy } from './useCreatePolicy'
export { useGetPolicies } from './useGetPolicies'
export { useGetPolicyDetail } from './useGetPolicyDetail'
export { useUpdatePolicy } from './useUpdatePolicy'

export type {
  AvailableClientResponse,
  AvailableInsurerResponse,
  CreatePolicyRequest,
  CreatePolicyResponse,
  GetPoliciesResponse,
  PaginationMetadata,
  PolicyDetailResponse,
  PolicyListItemResponse,
  PolicyStatus,
  UpdatePolicyRequest,
  UpdatePolicyResponse,
} from '../../types/policies'
