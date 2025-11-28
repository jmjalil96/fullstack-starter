import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { UserType } from '../users'
import { getAgents, getEmployees, getUsers } from '../usersApi'

// Centralized Query Keys
export const USERS_KEYS = {
  all: ['users'] as const,
  lists: () => [...USERS_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...USERS_KEYS.lists(), params] as const,
}

export const EMPLOYEES_KEYS = {
  all: ['employees'] as const,
  lists: () => [...EMPLOYEES_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...EMPLOYEES_KEYS.lists(), params] as const,
}

export const AGENTS_KEYS = {
  all: ['agents'] as const,
  lists: () => [...AGENTS_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...AGENTS_KEYS.lists(), params] as const,
}

// --- Users List Query ---

interface UseUsersParams {
  type?: UserType
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export function useUsers(params: UseUsersParams = {}) {
  return useQuery({
    queryKey: USERS_KEYS.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => getUsers(params, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}

// --- Employees List Query ---

interface UseEmployeesParams {
  search?: string
  department?: string
  hasUserAccount?: boolean
  isActive?: boolean
  page?: number
  limit?: number
}

export function useEmployees(params: UseEmployeesParams = {}) {
  return useQuery({
    queryKey: EMPLOYEES_KEYS.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => getEmployees(params, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}

// --- Agents List Query ---

interface UseAgentsParams {
  search?: string
  hasUserAccount?: boolean
  isActive?: boolean
  page?: number
  limit?: number
}

export function useAgents(params: UseAgentsParams = {}) {
  return useQuery({
    queryKey: AGENTS_KEYS.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => getAgents(params, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}
