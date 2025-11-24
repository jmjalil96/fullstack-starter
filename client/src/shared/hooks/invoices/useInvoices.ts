import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getInvoiceById, getInvoices } from '../../services/invoicesApi'
import type { InvoiceStatus, PaymentStatus } from '../../types/invoices'

// Centralized Query Keys
export const INVOICES_KEYS = {
  all: ['invoices-v2'] as const,
  lists: () => [...INVOICES_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...INVOICES_KEYS.lists(), params] as const,
  details: () => [...INVOICES_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INVOICES_KEYS.details(), id] as const,
}

// --- List Query ---

interface UseInvoicesParams {
  search?: string
  status?: InvoiceStatus
  paymentStatus?: PaymentStatus
  clientId?: string
  insurerId?: string
  page?: number
  limit?: number
}

export function useInvoices(params: UseInvoicesParams = {}) {
  return useQuery({
    queryKey: INVOICES_KEYS.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => getInvoices(params, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}

// --- Detail Query ---

export function useInvoiceDetail(invoiceId: string) {
  return useQuery({
    queryKey: INVOICES_KEYS.detail(invoiceId),
    queryFn: ({ signal }) => getInvoiceById(invoiceId, { signal }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}
