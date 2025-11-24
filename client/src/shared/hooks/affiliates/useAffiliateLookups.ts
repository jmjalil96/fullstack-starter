import { useQuery } from '@tanstack/react-query'

import { getAvailableClients, getAvailableOwners } from '../../services/affiliatesApi'

/**
 * Query keys for affiliate lookup endpoints
 * Separate from main AFFILIATES_KEYS since these are for form dropdowns
 */
export const AFFILIATE_LOOKUP_KEYS = {
  clients: ['affiliates-v2', 'available-clients'] as const,
  owners: (clientId: string) => ['affiliates-v2', 'available-owners', clientId] as const,
}

/**
 * Fetch available clients for affiliate creation
 * Returns active clients the current user can create affiliates for (based on role)
 *
 * @returns Query result with array of available clients
 *
 * @example
 * const { data: clients = [] } = useAvailableAffiliateClients()
 * const clientOptions = clients.map(c => ({ value: c.id, label: c.name }))
 */
export function useAvailableAffiliateClients() {
  return useQuery({
    queryKey: AFFILIATE_LOOKUP_KEYS.clients,
    queryFn: ({ signal }) => getAvailableClients({ signal }),
    staleTime: 1000 * 60 * 5, // 5 min cache (static data)
  })
}

/**
 * Fetch available owner affiliates for primary affiliate selection
 * Returns active OWNER affiliates from the specified client
 * Used when creating DEPENDENT affiliates to select their primary affiliate
 *
 * @param clientId - Client ID to fetch owners for
 * @param enabled - Whether to enable the query (default true)
 * @returns Query result with array of owner affiliates
 *
 * @example
 * const { data: owners = [] } = useAvailableOwners(clientId, !!clientId)
 * const ownerOptions = owners.map(o => ({
 *   value: o.id,
 *   label: `${o.firstName} ${o.lastName}`
 * }))
 */
export function useAvailableOwners(clientId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: clientId
      ? AFFILIATE_LOOKUP_KEYS.owners(clientId)
      : (['affiliates-v2', 'available-owners', 'idle'] as const),
    queryFn: ({ signal }) => {
      if (!clientId) return Promise.resolve([])
      return getAvailableOwners(clientId, { signal })
    },
    enabled: !!clientId && enabled,
    staleTime: 1000 * 60 * 5, // 5 min cache (relatively static data)
  })
}