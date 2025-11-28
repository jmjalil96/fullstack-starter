import { useQuery } from '@tanstack/react-query'

import { getRoles } from '../rolesApi'

// Centralized Query Keys
export const ROLES_KEYS = {
  all: ['roles'] as const,
  list: () => [...ROLES_KEYS.all, 'list'] as const,
}

// --- List Query ---

export function useRoles() {
  return useQuery({
    queryKey: ROLES_KEYS.list(),
    queryFn: ({ signal }) => getRoles({ signal }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
