import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getAffiliateById, getAffiliates } from '../../services/affiliatesApi'
import type { AffiliateType, CoverageType } from '../../types/affiliates'

// Centralized Query Keys
export const AFFILIATES_KEYS = {
  all: ['affiliates-v2'] as const,
  lists: () => [...AFFILIATES_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...AFFILIATES_KEYS.lists(), params] as const,
  details: () => [...AFFILIATES_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...AFFILIATES_KEYS.details(), id] as const,
}

// --- List Query ---

interface UseAffiliatesParams {
  search?: string
  clientId?: string
  affiliateType?: AffiliateType
  coverageType?: CoverageType
  isActive?: boolean
  page?: number
  limit?: number
}

export function useAffiliates(params: UseAffiliatesParams = {}) {
  return useQuery({
    queryKey: AFFILIATES_KEYS.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => getAffiliates(params, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}

// --- Detail Query ---

export function useAffiliateDetail(affiliateId: string) {
  return useQuery({
    queryKey: AFFILIATES_KEYS.detail(affiliateId),
    queryFn: ({ signal }) => getAffiliateById(affiliateId, { signal }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}
