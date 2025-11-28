import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  EditAgentRequest,
  EditEmployeeRequest,
  EditUserRequest,
  UpdateClientAccessRequest,
} from '../users'
import {
  deactivateUser,
  editAgent,
  editEmployee,
  editUser,
  updateClientAccess,
} from '../usersApi'

import { AGENTS_KEYS, EMPLOYEES_KEYS, USERS_KEYS } from './useUsers'

export function useEditUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditUserRequest }) => editUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() })
    },
  })
}

export function useUpdateClientAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientAccessRequest }) =>
      updateClientAccess(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() })
    },
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: AGENTS_KEYS.lists() })
    },
  })
}

export function useEditEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditEmployeeRequest }) =>
      editEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() })
    },
  })
}

export function useEditAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditAgentRequest }) => editAgent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENTS_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: USERS_KEYS.lists() })
    },
  })
}
