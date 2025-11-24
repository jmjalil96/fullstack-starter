import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getAffiliates } from '../../affiliates/affiliatesApi'
import type { InvoiceStatus } from '../../invoices/invoices'
import { getInvoices } from '../../invoices/invoicesApi'
import type { PolicyStatus } from '../../policies/policies'
import { getPolicies } from '../../policies/policiesApi'
import { getClientById, getClients } from '../clientsApi'

// Centralized Query Keys
export const CLIENTS_KEYS = {
  all: ['clients-v2'] as const,
  lists: () => [...CLIENTS_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...CLIENTS_KEYS.lists(), params] as const,
  details: () => [...CLIENTS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CLIENTS_KEYS.details(), id] as const,
  policies: (id: string, params: Record<string, unknown>) =>
    [...CLIENTS_KEYS.detail(id), 'policies', params] as const,
  affiliates: (id: string, params: Record<string, unknown>) =>
    [...CLIENTS_KEYS.detail(id), 'affiliates', params] as const,
  invoices: (id: string, params: Record<string, unknown>) =>
    [...CLIENTS_KEYS.detail(id), 'invoices', params] as const,
}

// --- List Query ---

interface UseClientsParams {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export function useClients(params: UseClientsParams = {}) {
  return useQuery({
    queryKey: CLIENTS_KEYS.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => getClients(params, { signal }),
    placeholderData: keepPreviousData, // Seamless pagination
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  })
}

// --- Detail Query ---

export function useClientDetail(clientId: string) {
  return useQuery({
    queryKey: CLIENTS_KEYS.detail(clientId),
    queryFn: ({ signal }) => getClientById(clientId, { signal }),
    staleTime: 1000 * 60 * 5,
    retry: 1, // Only retry once for 404s
  })
}

// --- Count Queries (for Tab Badges) ---

export function useClientCounts(clientId: string) {
  const policiesCount = useQuery({
    queryKey: [...CLIENTS_KEYS.detail(clientId), 'policies-count'],
    queryFn: async ({ signal }) => {
      const res = await getPolicies({ clientId, limit: 1 }, { signal })
      return res.pagination.total
    },
    staleTime: 1000 * 60 * 5,
  })

  const affiliatesCount = useQuery({
    queryKey: [...CLIENTS_KEYS.detail(clientId), 'affiliates-count'],
    queryFn: async ({ signal }) => {
      const res = await getAffiliates({ clientId, limit: 1 }, { signal })
      return res.pagination.total
    },
    staleTime: 1000 * 60 * 5,
  })

  const invoicesCount = useQuery({
    queryKey: [...CLIENTS_KEYS.detail(clientId), 'invoices-count'],
    queryFn: async ({ signal }) => {
      const res = await getInvoices({ clientId, limit: 1 }, { signal })
      return res.pagination.total
    },
    staleTime: 1000 * 60 * 5,
  })

  return {
    policies: policiesCount.data,
    affiliates: affiliatesCount.data,
    invoices: invoicesCount.data,
    isLoading: policiesCount.isLoading || affiliatesCount.isLoading || invoicesCount.isLoading,
  }
}

// --- Tab Queries (Lazy Loaded) ---

interface UseClientPoliciesParams {
  page?: number
  limit?: number
  status?: PolicyStatus
  enabled?: boolean
}

export function useClientPolicies(clientId: string, params: UseClientPoliciesParams = {}) {
  const { enabled = true, ...queryParams } = params
  return useQuery({
    queryKey: CLIENTS_KEYS.policies(clientId, queryParams as Record<string, unknown>),
    queryFn: ({ signal }) => getPolicies({ clientId, ...queryParams }, { signal }),
    enabled: !!clientId && enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}

interface UseClientAffiliatesParams {
  page?: number
  limit?: number
  search?: string
  enabled?: boolean
}

export function useClientAffiliates(clientId: string, params: UseClientAffiliatesParams = {}) {
  const { enabled = true, ...queryParams } = params
  return useQuery({
    queryKey: CLIENTS_KEYS.affiliates(clientId, queryParams as Record<string, unknown>),
    queryFn: ({ signal }) => getAffiliates({ clientId, ...queryParams }, { signal }),
    enabled: !!clientId && enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}

interface UseClientInvoicesParams {
  page?: number
  limit?: number
  status?: InvoiceStatus
  enabled?: boolean
}

export function useClientInvoices(clientId: string, params: UseClientInvoicesParams = {}) {
  const { enabled = true, ...queryParams } = params
  return useQuery({
    queryKey: CLIENTS_KEYS.invoices(clientId, queryParams as Record<string, unknown>),
    queryFn: ({ signal }) => getInvoices({ clientId, ...queryParams }, { signal }),
    enabled: !!clientId && enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}
