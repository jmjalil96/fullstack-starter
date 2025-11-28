import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getAgentById, getAgents } from '../agentsApi'

// Centralized Query Keys
export const AGENTS_KEYS = {
  all: ['agents'] as const,
  lists: () => [...AGENTS_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...AGENTS_KEYS.lists(), params] as const,
  details: () => [...AGENTS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...AGENTS_KEYS.details(), id] as const,
}

// --- List Query ---

interface UseAgentsParams {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export function useAgents(params: UseAgentsParams = {}) {
  return useQuery({
    queryKey: AGENTS_KEYS.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => getAgents(params, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}

// --- Detail Query ---

export function useAgentDetail(agentId: string) {
  return useQuery({
    queryKey: AGENTS_KEYS.detail(agentId),
    queryFn: ({ signal }) => getAgentById(agentId, { signal }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}
