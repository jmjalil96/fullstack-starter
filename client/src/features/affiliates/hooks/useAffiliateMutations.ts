import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { CreateAffiliateRequest, UpdateAffiliateRequest } from '../affiliates'
import { createAffiliate, updateAffiliate } from '../affiliatesApi'

import { AFFILIATES_KEYS } from './useAffiliates'

export function useCreateAffiliate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAffiliateRequest) => createAffiliate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AFFILIATES_KEYS.lists() })
    },
  })
}

export function useUpdateAffiliate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAffiliateRequest }) =>
      updateAffiliate(id, data),
    onSuccess: (updatedAffiliate, variables) => {
      queryClient.setQueryData(AFFILIATES_KEYS.detail(variables.id), updatedAffiliate)
      queryClient.invalidateQueries({ queryKey: AFFILIATES_KEYS.lists() })
    },
  })
}
