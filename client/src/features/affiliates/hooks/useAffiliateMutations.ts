import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { UpdateAffiliateRequest } from '../affiliates'
import { updateAffiliate } from '../affiliatesApi'

import { AFFILIATES_KEYS } from './useAffiliates'

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
