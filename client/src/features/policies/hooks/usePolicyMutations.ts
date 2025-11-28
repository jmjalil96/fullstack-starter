import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  CreatePolicyRequest,
  UpdatePolicyRequest,
  AddAffiliateToPolicyRequest,
  RemoveAffiliateFromPolicyRequest,
} from '../policies'
import { createPolicy, updatePolicy, addAffiliateToPolicy, removeAffiliateFromPolicy } from '../policiesApi'

import { POLICIES_KEYS } from './usePolicies'

export function useCreatePolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePolicyRequest) => createPolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POLICIES_KEYS.lists() })
    },
  })
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePolicyRequest }) => updatePolicy(id, data),
    onSuccess: (updatedPolicy, variables) => {
      queryClient.setQueryData(POLICIES_KEYS.detail(variables.id), updatedPolicy)
      queryClient.invalidateQueries({ queryKey: POLICIES_KEYS.lists() })
    },
  })
}

export function useAddAffiliateToPolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ policyId, data }: { policyId: string; data: AddAffiliateToPolicyRequest }) =>
      addAffiliateToPolicy(policyId, data),
    onSuccess: (_createdAffiliate, variables) => {
      // Invalidate policy affiliates list to refresh the tab
      queryClient.invalidateQueries({
        queryKey: [...POLICIES_KEYS.detail(variables.policyId), 'affiliates']
      })
      // Also invalidate the affiliates count
      queryClient.invalidateQueries({
        queryKey: [...POLICIES_KEYS.detail(variables.policyId), 'affiliates-count']
      })
      // Invalidate general affiliates list in case user navigates there
      queryClient.invalidateQueries({
        queryKey: ['affiliates-v2']
      })
    },
  })
}

export function useRemoveAffiliateFromPolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      policyId,
      affiliateId,
      data,
    }: {
      policyId: string
      affiliateId: string
      data: RemoveAffiliateFromPolicyRequest
    }) => removeAffiliateFromPolicy(policyId, affiliateId, data),
    onSuccess: (_result, variables) => {
      // Invalidate policy affiliates list to refresh the tab
      queryClient.invalidateQueries({
        queryKey: [...POLICIES_KEYS.detail(variables.policyId), 'affiliates'],
      })
      // Also invalidate the affiliates count
      queryClient.invalidateQueries({
        queryKey: [...POLICIES_KEYS.detail(variables.policyId), 'affiliates-count'],
      })
      // Invalidate general affiliates list in case user navigates there
      queryClient.invalidateQueries({
        queryKey: ['affiliates-v2'],
      })
    },
  })
}
