import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getInsurerById, getInsurers } from '../insurersApi'

// Centralized Query Keys
export const INSURERS_KEYS = {
  all: ['insurers'] as const,
  lists: () => [...INSURERS_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...INSURERS_KEYS.lists(), params] as const,
  details: () => [...INSURERS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INSURERS_KEYS.details(), id] as const,
}

// --- List Query ---

interface UseInsurersParams {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export function useInsurers(params: UseInsurersParams = {}) {
  return useQuery({
    queryKey: INSURERS_KEYS.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => getInsurers(params, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}

// --- Detail Query ---

export function useInsurerDetail(insurerId: string) {
  return useQuery({
    queryKey: INSURERS_KEYS.detail(insurerId),
    queryFn: ({ signal }) => getInsurerById(insurerId, { signal }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}
