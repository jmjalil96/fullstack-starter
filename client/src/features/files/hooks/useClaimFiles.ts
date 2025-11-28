import { useQuery } from '@tanstack/react-query'

import { getClaimFiles } from '../filesApi'

// Centralized Query Keys
export const FILES_KEYS = {
  all: ['files'] as const,
  claimFiles: () => [...FILES_KEYS.all, 'claim'] as const,
  claimFile: (claimId: string) => [...FILES_KEYS.claimFiles(), claimId] as const,
}

// --- Claim Files Query ---

interface UseClaimFilesOptions {
  enabled?: boolean
}

/**
 * Hook to fetch files attached to a claim
 *
 * Supports lazy loading via enabled option (only fetch when tab is active).
 *
 * @param claimId - Claim ID to fetch files for
 * @param options - Query options (enabled for lazy loading)
 *
 * @example
 * // Basic usage
 * const { data, isLoading } = useClaimFiles(claimId)
 *
 * @example
 * // Lazy load when tab is active
 * const { data } = useClaimFiles(claimId, { enabled: activeTab === 'files' })
 */
export function useClaimFiles(claimId: string, options?: UseClaimFilesOptions) {
  return useQuery({
    queryKey: FILES_KEYS.claimFile(claimId),
    queryFn: ({ signal }) => getClaimFiles(claimId, { signal }),
    enabled: options?.enabled !== false && !!claimId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
