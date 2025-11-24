import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createInvoice, updateInvoice, validateInvoice } from '../../services/invoicesApi'
import type { CreateInvoiceRequest, InvoiceUpdateRequest } from '../../types/invoices'

import { INVOICES_KEYS } from './useInvoices'

export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInvoiceRequest) => createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_KEYS.lists() })
    },
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InvoiceUpdateRequest }) =>
      updateInvoice(id, data),
    onSuccess: (updatedInvoice, variables) => {
      queryClient.setQueryData(INVOICES_KEYS.detail(variables.id), updatedInvoice)
      queryClient.invalidateQueries({ queryKey: INVOICES_KEYS.lists() })
    },
  })
}

export function useValidateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invoiceId: string) => validateInvoice(invoiceId),
    onSuccess: (validatedInvoice, invoiceId) => {
      // Update detail cache with validation results
      queryClient.setQueryData(INVOICES_KEYS.detail(invoiceId), validatedInvoice)
      // Invalidate lists (counts/amounts changed)
      queryClient.invalidateQueries({ queryKey: INVOICES_KEYS.lists() })
    },
  })
}
