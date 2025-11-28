/**
 * Validation schemas for editing employees
 */

import { z } from 'zod'

/**
 * Path parameter validation
 */
export const employeeIdParamSchema = z.object({
  id: z.string().cuid('ID de empleado inválido'),
})

export type EmployeeIdParam = z.infer<typeof employeeIdParamSchema>

/**
 * Request body validation for PATCH /api/employees/:id
 */
export const editEmployeeSchema = z
  .object({
    firstName: z.string().trim().min(2).max(100).optional(),
    lastName: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().max(50).nullable().optional(),
    position: z.string().trim().max(100).nullable().optional(),
    department: z.string().trim().max(100).nullable().optional(),
    employeeCode: z.string().trim().max(50).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strip()
  .refine(
    (data) =>
      data.firstName !== undefined ||
      data.lastName !== undefined ||
      data.phone !== undefined ||
      data.position !== undefined ||
      data.department !== undefined ||
      data.employeeCode !== undefined ||
      data.isActive !== undefined,
    { message: 'Se requiere al menos un campo para actualizar' }
  )

export type EditEmployeeInput = z.infer<typeof editEmployeeSchema>
