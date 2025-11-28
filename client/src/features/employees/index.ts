/**
 * Employees feature exports
 */

// Components
export { EditEmployeeModal } from './components/EditEmployeeModal'
export { EmployeeDetail } from './components/EmployeeDetail'
export { EmployeeForm } from './components/EmployeeForm'
export { EmployeesList } from './components/EmployeesList'

// Hooks
export { EMPLOYEES_KEYS, useEmployeeDetail, useEmployees } from './hooks/useEmployees'
export { useUpdateEmployee } from './hooks/useEmployeeMutations'

// Types
export type {
  EmployeeDetailResponse,
  EmployeeListItemResponse,
  GetEmployeesResponse,
  UpdateEmployeeRequest,
  UpdateEmployeeResponse,
} from './employees'

// Schemas
export { updateEmployeeSchema, type EmployeeUpdateFormData } from './schemas/updateEmployeeSchema'
