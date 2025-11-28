import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { UpdateEmployeeRequest } from '../employees'
import { updateEmployee } from '../employeesApi'

import { EMPLOYEES_KEYS } from './useEmployees'

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeRequest }) =>
      updateEmployee(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEYS.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEYS.lists() })
    },
  })
}
