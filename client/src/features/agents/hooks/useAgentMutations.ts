import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { UpdateAgentRequest } from '../agents'
import { updateAgent } from '../agentsApi'

import { AGENTS_KEYS } from './useAgents'

export function useUpdateAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgentRequest }) =>
      updateAgent(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: AGENTS_KEYS.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: AGENTS_KEYS.lists() })
    },
  })
}
