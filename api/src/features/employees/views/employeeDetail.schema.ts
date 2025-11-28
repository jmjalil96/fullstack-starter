/**
 * Validation schema for employee detail endpoint (GET /api/employees/:id)
 */

import { z } from 'zod'

/**
 * Path parameter validation for GET /api/employees/:id
 *
 * Validates the employee ID is a valid CUID format.
 */
export const employeeIdParamSchema = z.object({
  id: z.string().cuid('ID de empleado inválido'),
})

/**
 * Inferred TypeScript type from schema
 */
export type EmployeeIdParam = z.infer<typeof employeeIdParamSchema>
