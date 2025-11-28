import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { CreateInsurerRequest, UpdateInsurerRequest } from '../insurers'
import { createInsurer, updateInsurer } from '../insurersApi'

import { INSURERS_KEYS } from './useInsurers'

export function useCreateInsurer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInsurerRequest) => createInsurer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSURERS_KEYS.lists() })
    },
  })
}

export function useUpdateInsurer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInsurerRequest }) =>
      updateInsurer(id, data),
    onSuccess: (updatedInsurer, variables) => {
      queryClient.setQueryData(INSURERS_KEYS.detail(variables.id), updatedInsurer)
      queryClient.invalidateQueries({ queryKey: INSURERS_KEYS.lists() })
    },
  })
}
