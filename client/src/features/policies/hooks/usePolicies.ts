import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { AffiliateType } from '../../affiliates/affiliates'
import type { PolicyStatus } from '../policies'
import { getPolicies, getPolicyAffiliates, getPolicyById } from '../policiesApi'

// Centralized Query Keys
export const POLICIES_KEYS = {
  all: ['policies-v2'] as const,
  lists: () => [...POLICIES_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...POLICIES_KEYS.lists(), params] as const,
  details: () => [...POLICIES_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...POLICIES_KEYS.details(), id] as const,
  affiliates: (id: string, params: Record<string, unknown>) =>
    [...POLICIES_KEYS.detail(id), 'affiliates', params] as const,
}

// --- List Query ---

interface UsePoliciesParams {
  search?: string
  status?: PolicyStatus
  clientId?: string
  insurerId?: string
  page?: number
  limit?: number
}

export function usePolicies(params: UsePoliciesParams = {}) {
  return useQuery({
    queryKey: POLICIES_KEYS.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => getPolicies(params, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}

// --- Detail Query ---

export function usePolicyDetail(policyId: string) {
  return useQuery({
    queryKey: POLICIES_KEYS.detail(policyId),
    queryFn: ({ signal }) => getPolicyById(policyId, { signal }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

// --- Count Query (for Tab Badge) ---

export function usePolicyCounts(policyId: string) {
  const affiliatesCount = useQuery({
    queryKey: [...POLICIES_KEYS.detail(policyId), 'affiliates-count'],
    queryFn: async ({ signal }) => {
      const res = await getPolicyAffiliates(policyId, { limit: 1 }, { signal })
      return res.pagination.total
    },
    staleTime: 1000 * 60 * 5,
  })

  return {
    affiliates: affiliatesCount.data,
    isLoading: affiliatesCount.isLoading,
  }
}

// --- Tab Query (Lazy Loaded) ---

interface UsePolicyAffiliatesParams {
  page?: number
  limit?: number
  search?: string
  affiliateType?: AffiliateType
  enabled?: boolean
}

export function usePolicyAffiliates(policyId: string, params: UsePolicyAffiliatesParams = {}) {
  const { enabled = true, ...queryParams } = params
  return useQuery({
    queryKey: POLICIES_KEYS.affiliates(policyId, queryParams as Record<string, unknown>),
    queryFn: ({ signal }) => getPolicyAffiliates(policyId, queryParams, { signal }),
    enabled: !!policyId && enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}
