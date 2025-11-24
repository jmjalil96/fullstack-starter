import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createPolicy, updatePolicy } from '../../services/policiesApi'
import type { CreatePolicyRequest, UpdatePolicyRequest } from '../../types/policies'

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
