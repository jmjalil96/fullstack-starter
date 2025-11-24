import { useQuery } from '@tanstack/react-query'

import { getAvailableClients, getAvailableInsurers } from '../policiesApi'

/**
 * Query keys for policy lookup endpoints
 * Separate from main POLICIES_KEYS since these are for form dropdowns
 */
export const POLICY_LOOKUP_KEYS = {
  clients: ['policies-v2', 'available-clients'] as const,
  insurers: ['policies-v2', 'available-insurers'] as const,
}

/**
 * Fetch available clients for policy creation/editing
 * Returns clients the current user can create policies for (based on role)
 */
export function useAvailablePolicyClients() {
  return useQuery({
    queryKey: POLICY_LOOKUP_KEYS.clients,
    queryFn: ({ signal }) => getAvailableClients({ signal }),
    staleTime: 1000 * 60 * 5, // 5 min cache (static data)
  })
}

/**
 * Fetch available insurers for policy creation/editing
 * Returns insurance companies available in the system
 */
export function useAvailablePolicyInsurers() {
  return useQuery({
    queryKey: POLICY_LOOKUP_KEYS.insurers,
    queryFn: ({ signal }) => getAvailableInsurers({ signal }),
    staleTime: 1000 * 60 * 5, // 5 min cache (static data)
  })
}
