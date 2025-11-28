import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getEmployeeById, getEmployees } from '../employeesApi'

// Centralized Query Keys
export const EMPLOYEES_KEYS = {
  all: ['employees'] as const,
  lists: () => [...EMPLOYEES_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...EMPLOYEES_KEYS.lists(), params] as const,
  details: () => [...EMPLOYEES_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EMPLOYEES_KEYS.details(), id] as const,
}

// --- List Query ---

interface UseEmployeesParams {
  search?: string
  department?: string
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

// --- Detail Query ---

export function useEmployeeDetail(employeeId: string) {
  return useQuery({
    queryKey: EMPLOYEES_KEYS.detail(employeeId),
    queryFn: ({ signal }) => getEmployeeById(employeeId, { signal }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}
