import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getClaimById, getClaims } from '../../services/claimsApi'
import type { ClaimStatus } from '../../types/claims'

// Centralized Query Keys
export const CLAIMS_KEYS = {
  all: ['claims-v2'] as const,
  lists: () => [...CLAIMS_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...CLAIMS_KEYS.lists(), params] as const,
  details: () => [...CLAIMS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CLAIMS_KEYS.details(), id] as const,
}

// --- List Query ---

interface UseClaimsParams {
  search?: string
  status?: ClaimStatus
  clientId?: string
  page?: number
  limit?: number
}

export function useClaims(params: UseClaimsParams = {}) {
  return useQuery({
    queryKey: CLAIMS_KEYS.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => getClaims(params, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}

// --- Detail Query ---

export function useClaimDetail(claimId: string) {
  return useQuery({
    queryKey: CLAIMS_KEYS.detail(claimId),
    queryFn: ({ signal }) => getClaimById(claimId, { signal }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}
