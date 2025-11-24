import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ClaimUpdateRequest, CreateClaimRequest } from '../claims'
import { createClaim, updateClaim } from '../claimsApi'

import { CLAIMS_KEYS } from './useClaims'

export function useCreateClaim() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClaimRequest) => createClaim(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLAIMS_KEYS.lists() })
    },
  })
}

export function useUpdateClaim() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClaimUpdateRequest }) => updateClaim(id, data),
    onSuccess: (updatedClaim, variables) => {
      queryClient.setQueryData(CLAIMS_KEYS.detail(variables.id), updatedClaim)
      queryClient.invalidateQueries({ queryKey: CLAIMS_KEYS.lists() })
    },
  })
}
