import type { EmployeeDetailResponse, UpdateEmployeeRequest } from './employees'
import type { EmployeeUpdateFormData } from './schemas/updateEmployeeSchema'

/**
 * Convert EmployeeDetailResponse to form default values
 * Handles null → empty string conversion for form inputs
 */
export function getEmployeeFormValues(employee: EmployeeDetailResponse | undefined): EmployeeUpdateFormData {
  return {
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    phone: employee?.phone || '',
    position: employee?.position || '',
    department: employee?.department || '',
    employeeCode: employee?.employeeCode || '',
    isActive: employee?.isActive ?? true,
  }
}

/**
 * Convert empty string to null for API request
 */
const toNullable = (val: string | null | undefined): string | null | undefined => {
  if (val === undefined) return undefined
  if (val === '') return null
  return val
}

/**
 * Map edit form data to API request (only dirty fields)
 */
export function mapEmployeeEditFormToUpdateRequest(
  form: EmployeeUpdateFormData,
  dirty: Record<string, boolean | undefined>
): UpdateEmployeeRequest {
  const dto: UpdateEmployeeRequest = {}

  if (dirty.firstName) dto.firstName = form.firstName
  if (dirty.lastName) dto.lastName = form.lastName
  if (dirty.phone) dto.phone = toNullable(form.phone as string | null | undefined)
  if (dirty.position) dto.position = toNullable(form.position as string | null | undefined)
  if (dirty.department) dto.department = toNullable(form.department as string | null | undefined)
  if (dirty.employeeCode) dto.employeeCode = toNullable(form.employeeCode as string | null | undefined)
  if (dirty.isActive) dto.isActive = form.isActive

  return dto
}
