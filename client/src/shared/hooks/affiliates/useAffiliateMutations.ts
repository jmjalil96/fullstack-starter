import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createAffiliate, updateAffiliate } from '../../services/affiliatesApi'
import type { CreateAffiliateRequest, UpdateAffiliateRequest } from '../../types/affiliates'

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
