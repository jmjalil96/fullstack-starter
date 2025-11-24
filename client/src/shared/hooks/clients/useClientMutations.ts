import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createClient, updateClient } from '../../services/clientsApi'
import type { CreateClientRequest, UpdateClientRequest } from '../../types/clients'

import { CLIENTS_KEYS } from './useClients'

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClientRequest) => createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_KEYS.lists() })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientRequest }) => updateClient(id, data),
    onSuccess: (updatedClient, variables) => {
      queryClient.setQueryData(CLIENTS_KEYS.detail(variables.id), updatedClient)
      queryClient.invalidateQueries({ queryKey: CLIENTS_KEYS.lists() })
    },
  })
}
