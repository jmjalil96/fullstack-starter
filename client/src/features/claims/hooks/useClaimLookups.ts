import { useQuery } from '@tanstack/react-query'

import {
  getAvailableAffiliates,
  getAvailableClients,
  getAvailablePatients,
  getAvailablePolicies,
} from '../claimsApi'

/**
 * Query keys for claim lookup endpoints
 * Separate from main CLAIMS_KEYS since these are for form dropdowns
 */
export const CLAIM_LOOKUP_KEYS = {
  clients: ['claims-v2', 'available-clients'] as const,
  affiliates: (clientId: string) => ['claims-v2', 'available-affiliates', clientId] as const,
  patients: (affiliateId: string) => ['claims-v2', 'available-patients', affiliateId] as const,
  policies: (claimId: string) => ['claims-v2', 'available-policies', claimId] as const,
}

/**
 * Fetch available clients for claim creation
 * Returns clients the current user can submit claims for (based on role)
 */
export function useAvailableClaimClients() {
  return useQuery({
    queryKey: CLAIM_LOOKUP_KEYS.clients,
    queryFn: ({ signal }) => getAvailableClients({ signal }),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch available affiliates for a specific client
 * Only returns OWNER affiliates (titulares) who can submit claims
 *
 * @param clientId - Client ID to fetch affiliates for
 * @param enabled - Whether to enable the query (default true)
 */
export function useAvailableClaimAffiliates(clientId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: clientId
      ? CLAIM_LOOKUP_KEYS.affiliates(clientId)
      : (['claims-v2', 'available-affiliates', 'idle'] as const),
    queryFn: ({ signal }) => {
      if (!clientId) return Promise.resolve([])
      return getAvailableAffiliates(clientId, { signal })
    },
    enabled: !!clientId && enabled,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch available patients for a specific affiliate
 * Returns the affiliate (as 'self') + their dependents
 *
 * @param affiliateId - Affiliate ID to fetch patients for
 * @param enabled - Whether to enable the query (default true)
 */
export function useAvailableClaimPatients(affiliateId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: affiliateId
      ? CLAIM_LOOKUP_KEYS.patients(affiliateId)
      : (['claims-v2', 'available-patients', 'idle'] as const),
    queryFn: ({ signal }) => {
      if (!affiliateId) return Promise.resolve([])
      return getAvailablePatients(affiliateId, { signal })
    },
    enabled: !!affiliateId && enabled,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch available policies for a specific claim
 * Returns policies that can be assigned to the claim (filtered by client and affiliate coverage)
 *
 * @param claimId - Claim ID to fetch available policies for
 * @param enabled - Whether to enable the query (default true)
 */
export function useAvailableClaimPolicies(claimId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: claimId
      ? CLAIM_LOOKUP_KEYS.policies(claimId)
      : (['claims-v2', 'available-policies', 'idle'] as const),
    queryFn: ({ signal }) => {
      if (!claimId) return Promise.resolve([])
      return getAvailablePolicies(claimId, { signal })
    },
    enabled: !!claimId && enabled,
    staleTime: 1000 * 60 * 5,
  })
}
