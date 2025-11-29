/**
 * Claim Invoice mutation hooks
 * Handles add, edit, and remove operations for claim invoices
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { addClaimInvoice, editClaimInvoice, removeClaimInvoice } from '../claimInvoicesApi'
import type { AddClaimInvoiceRequest, EditClaimInvoiceRequest } from '../claims'

import { CLAIMS_KEYS } from './useClaims'

/**
 * Hook to add an invoice to a claim
 * Invalidates claim detail on success to refresh invoice list
 */
export function useAddClaimInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ claimId, data }: { claimId: string; data: AddClaimInvoiceRequest }) =>
      addClaimInvoice(claimId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: CLAIMS_KEYS.detail(variables.claimId),
      })
      // Invalidate audit logs to show the new entry
      queryClient.invalidateQueries({
        queryKey: CLAIMS_KEYS.auditLogs(variables.claimId),
      })
    },
  })
}

/**
 * Hook to edit an existing claim invoice
 * Invalidates claim detail on success to refresh invoice list
 */
export function useEditClaimInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      claimId,
      invoiceId,
      data,
    }: {
      claimId: string
      invoiceId: string
      data: EditClaimInvoiceRequest
    }) => editClaimInvoice(claimId, invoiceId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: CLAIMS_KEYS.detail(variables.claimId),
      })
      // Invalidate audit logs to show the new entry
      queryClient.invalidateQueries({
        queryKey: CLAIMS_KEYS.auditLogs(variables.claimId),
      })
    },
  })
}

/**
 * Hook to remove an invoice from a claim
 * Invalidates claim detail on success to refresh invoice list
 */
export function useRemoveClaimInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ claimId, invoiceId }: { claimId: string; invoiceId: string }) =>
      removeClaimInvoice(claimId, invoiceId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: CLAIMS_KEYS.detail(variables.claimId),
      })
      // Invalidate audit logs to show the new entry
      queryClient.invalidateQueries({
        queryKey: CLAIMS_KEYS.auditLogs(variables.claimId),
      })
    },
  })
}
