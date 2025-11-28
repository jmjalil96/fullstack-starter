/**
 * Validation schema for employee editing
 *
 * Mirrors backend validation from: api/src/features/employees/edit/editEmployee.schema.ts
 *
 * Used by:
 * - EditEmployeeModal form validation (react-hook-form)
 */

import { z } from 'zod'

/**
 * Employee update validation schema
 *
 * All fields optional (partial update pattern).
 * Null values allowed for nullable fields (phone, position, department, employeeCode).
 * At least one field must be provided (empty updates rejected).
 */
export const updateEmployeeSchema = z
  .object({
    /** First name (2-50 chars) */
    firstName: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede exceder 50 caracteres')
      .optional(),

    /** Last name (2-50 chars) */
    lastName: z
      .string()
      .trim()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(50, 'El apellido no puede exceder 50 caracteres')
      .optional(),

    /** Phone (7-20 chars, can be null to clear) */
    phone: z
      .string()
      .trim()
      .min(7, 'El teléfono debe tener al menos 7 caracteres')
      .max(20, 'El teléfono no puede exceder 20 caracteres')
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Position (2-100 chars, can be null to clear) */
    position: z
      .string()
      .trim()
      .min(2, 'El cargo debe tener al menos 2 caracteres')
      .max(100, 'El cargo no puede exceder 100 caracteres')
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Department (2-100 chars, can be null to clear) */
    department: z
      .string()
      .trim()
      .min(2, 'El departamento debe tener al menos 2 caracteres')
      .max(100, 'El departamento no puede exceder 100 caracteres')
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Employee code (2-50 chars, can be null to clear) */
    employeeCode: z
      .string()
      .trim()
      .min(2, 'El código debe tener al menos 2 caracteres')
      .max(50, 'El código no puede exceder 50 caracteres')
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Active status */
    isActive: z.boolean().optional(),
  })
  .strip()
  .superRefine((data, ctx) => {
    // Reject empty updates (at least one field must have a defined value)
    const hasAnyValue = Object.values(data).some((v) => v !== undefined)
    if (!hasAnyValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe proporcionar al menos un campo para actualizar',
      })
    }
  })

/**
 * Inferred type from schema
 */
export type EmployeeUpdateFormData = z.infer<typeof updateEmployeeSchema>
