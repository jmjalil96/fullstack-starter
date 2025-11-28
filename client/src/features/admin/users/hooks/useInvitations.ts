import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { InvitationStatus, InvitationType } from '../invitations'
import { getInvitableAffiliates, getInvitations, validateInvitation } from '../invitationsApi'

// Centralized Query Keys
export const INVITATIONS_KEYS = {
  all: ['invitations'] as const,
  lists: () => [...INVITATIONS_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...INVITATIONS_KEYS.lists(), params] as const,
  validate: (token: string) => [...INVITATIONS_KEYS.all, 'validate', token] as const,
  invitableAffiliates: () => [...INVITATIONS_KEYS.all, 'invitable-affiliates'] as const,
  invitableAffiliatesList: (params: Record<string, unknown>) =>
    [...INVITATIONS_KEYS.invitableAffiliates(), params] as const,
}

// --- List Query ---

interface UseInvitationsParams {
  status?: InvitationStatus
  type?: InvitationType
  search?: string
  page?: number
  limit?: number
}

export function useInvitations(params: UseInvitationsParams = {}) {
  return useQuery({
    queryKey: INVITATIONS_KEYS.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => getInvitations(params, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}

// --- Validate Query (Public) ---

export function useValidateInvitation(token: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: INVITATIONS_KEYS.validate(token),
    queryFn: ({ signal }) => validateInvitation(token, { signal }),
    enabled: !!token && (options?.enabled ?? true),
    staleTime: 1000 * 60, // 1 minute
    retry: false,
  })
}

// --- Invitable Affiliates Query ---

interface UseInvitableAffiliatesParams {
  clientId?: string
  search?: string
  page?: number
  limit?: number
  enabled?: boolean
}

export function useInvitableAffiliates(params: UseInvitableAffiliatesParams = {}) {
  const { enabled = true, ...queryParams } = params
  return useQuery({
    queryKey: INVITATIONS_KEYS.invitableAffiliatesList(queryParams as Record<string, unknown>),
    queryFn: ({ signal }) => getInvitableAffiliates(queryParams, { signal }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}
