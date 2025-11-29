import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { ClaimStatus } from '../claims'
import { getClaimAuditLogs, getClaimById, getClaims } from '../claimsApi'

// Centralized Query Keys
export const CLAIMS_KEYS = {
  all: ['claims-v2'] as const,
  lists: () => [...CLAIMS_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...CLAIMS_KEYS.lists(), params] as const,
  details: () => [...CLAIMS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CLAIMS_KEYS.details(), id] as const,
  // Kanban keys (separate cache namespace from list view)
  kanban: () => [...CLAIMS_KEYS.all, 'kanban'] as const,
  kanbanColumn: (status: ClaimStatus) => [...CLAIMS_KEYS.kanban(), status] as const,
  // Mobile list keys (infinite scroll, separate from paginated list)
  mobileList: () => [...CLAIMS_KEYS.all, 'mobile'] as const,
  mobileListParams: (params: Record<string, unknown>) => [...CLAIMS_KEYS.mobileList(), params] as const,
  // Audit logs keys
  auditLogs: (claimId: string) => [...CLAIMS_KEYS.detail(claimId), 'audit-logs'] as const,
  auditLogsPage: (claimId: string, params: Record<string, unknown>) =>
    [...CLAIMS_KEYS.auditLogs(claimId), params] as const,
}

// --- List Query ---

interface UseClaimsParams {
  search?: string
  status?: ClaimStatus
  clientId?: string
  dateField?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  enabled?: boolean
}

export function useClaims({ enabled = true, ...params }: UseClaimsParams = {}) {
  return useQuery({
    queryKey: CLAIMS_KEYS.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => getClaims(params, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    enabled,
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

// --- Audit Logs Query ---

interface UseClaimAuditLogsParams {
  page?: number
  limit?: number
  enabled?: boolean
}

export function useClaimAuditLogs(
  claimId: string,
  { enabled = true, ...params }: UseClaimAuditLogsParams = {}
) {
  return useQuery({
    queryKey: CLAIMS_KEYS.auditLogsPage(claimId, params as Record<string, unknown>),
    queryFn: ({ signal }) => getClaimAuditLogs(claimId, params, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    enabled,
  })
}
