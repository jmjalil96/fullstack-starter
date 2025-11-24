import { useQuery } from '@tanstack/react-query'

import { getAvailableInsurers } from '../../policies/policiesApi'
import { getAvailableClients, getAvailablePolicies } from '../invoicesApi'

/**
 * Query keys for invoice lookup endpoints
 * Separate from main INVOICES_KEYS since these are for form dropdowns
 */
export const INVOICE_LOOKUP_KEYS = {
  clients: ['invoices-v2', 'available-clients'] as const,
  insurers: ['invoices-v2', 'available-insurers'] as const,
  policies: (params?: { clientId?: string; insurerId?: string }) =>
    ['invoices-v2', 'available-policies', params || {}] as const,
}

/**
 * Fetch available clients for invoice creation/editing
 * Returns clients the current user can manage invoices for (based on role)
 */
export function useAvailableInvoiceClients() {
  return useQuery({
    queryKey: INVOICE_LOOKUP_KEYS.clients,
    queryFn: ({ signal }) => getAvailableClients({ signal }),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch available insurers for invoice creation/editing
 * Reuses the policies endpoint since insurers are shared across modules
 */
export function useAvailableInvoiceInsurers() {
  return useQuery({
    queryKey: INVOICE_LOOKUP_KEYS.insurers,
    queryFn: ({ signal }) => getAvailableInsurers({ signal }),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch available policies for invoice creation/editing
 * Policies are filtered by client and insurer when provided
 * @param params - Optional filters for client and/or insurer
 * @param enabled - Whether the query should run (default: true)
 */
export function useAvailableInvoicePolicies(
  params?: { clientId?: string; insurerId?: string },
  enabled = true
) {
  return useQuery({
    queryKey: INVOICE_LOOKUP_KEYS.policies(params),
    queryFn: ({ signal }) => getAvailablePolicies(params, { signal }),
    enabled: enabled && !!(params?.clientId && params?.insurerId), // Only run if both client and insurer are selected
    staleTime: 1000 * 60 * 5,
  })
}
