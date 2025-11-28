import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  InviteAffiliateRequest,
  InviteAffiliatesBulkRequest,
  InviteAgentRequest,
  InviteEmployeeRequest,
} from '../invitations'
import {
  acceptInvitation,
  inviteAffiliate,
  inviteAffiliatesBulk,
  inviteAgent,
  inviteEmployee,
  resendInvitation,
  revokeInvitation,
} from '../invitationsApi'

import { INVITATIONS_KEYS } from './useInvitations'

export function useInviteEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InviteEmployeeRequest) => inviteEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITATIONS_KEYS.lists() })
    },
  })
}

export function useInviteAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InviteAgentRequest) => inviteAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITATIONS_KEYS.lists() })
    },
  })
}

export function useInviteAffiliate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InviteAffiliateRequest) => inviteAffiliate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITATIONS_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: INVITATIONS_KEYS.invitableAffiliates() })
    },
  })
}

export function useInviteAffiliatesBulk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InviteAffiliatesBulkRequest) => inviteAffiliatesBulk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITATIONS_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: INVITATIONS_KEYS.invitableAffiliates() })
    },
  })
}

export function useResendInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => resendInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITATIONS_KEYS.lists() })
    },
  })
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => revokeInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITATIONS_KEYS.lists() })
    },
  })
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => acceptInvitation(token),
    onSuccess: (_data, token) => {
      queryClient.invalidateQueries({ queryKey: INVITATIONS_KEYS.validate(token) })
    },
  })
}
