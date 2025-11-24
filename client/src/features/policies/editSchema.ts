/**
 * Validation schema for policy editing
 *
 * FormData uses strings (HTML inputs produce strings)
 * Mapper converts to UpdatePolicyRequest (numbers, ISO dates)
 */

import { z } from 'zod'

/**
 * Validate ISO date string represents a real date
 */
const isValidISODate = (val?: string): boolean => {
  if (!val || val.trim() === '') return true
  const date = new Date(val)
  return !isNaN(date.getTime()) && val.includes('-')
}

/**
 * Validate numeric string is a valid non-negative number
 */
const isValidNumeric = (val?: string): boolean => {
  if (!val || val.trim() === '') return true
  const cleaned = val.replace(/[^0-9.-]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return !isNaN(num) && num >= 0
}

export const policyUpdateSchema = z
  .object({
    policyNumber: z.string().trim().toUpperCase().min(3).max(50).optional(),
    clientId: z.string().cuid().optional(),
    insurerId: z.string().cuid().optional(),
    type: z.string().trim().min(1).max(100).nullable().optional().or(z.literal('')),

    // Numeric fields as strings (converted by mapper) with validation
    ambCopay: z
      .string()
      .optional()
      .refine(isValidNumeric, { message: 'El copago ambulatorio debe ser un número válido mayor o igual a 0' }).or(z.literal(""))
      .or(z.literal('')),
    hospCopay: z
      .string()
      .optional()
      .refine(isValidNumeric, { message: 'El copago hospitalario debe ser un número válido mayor o igual a 0' }),
    maternity: z
      .string()
      .optional()
      .refine(isValidNumeric, { message: 'La maternidad debe ser un número válido mayor o igual a 0' }),
    tPremium: z
      .string()
      .optional()
      .refine(isValidNumeric, { message: 'La prima titular debe ser un número válido mayor o igual a 0' }),
    tplus1Premium: z
      .string()
      .optional()
      .refine(isValidNumeric, { message: 'La prima titular+1 debe ser un número válido mayor o igual a 0' }),
    tplusfPremium: z
      .string()
      .optional()
      .refine(isValidNumeric, { message: 'La prima titular+familia debe ser un número válido mayor o igual a 0' }),
    taxRate: z
      .string()
      .optional()
      .refine(isValidNumeric, { message: 'La tasa de impuesto debe ser un número válido mayor o igual a 0' }),
    additionalCosts: z
      .string()
      .optional()
      .refine(isValidNumeric, { message: 'Los costos adicionales deben ser un número válido mayor o igual a 0' }),

    // Dates as strings with proper validation
    startDate: z
      .string()
      .optional()
      .refine(isValidISODate, { message: 'Fecha de inicio inválida' }),
    endDate: z
      .string()
      .optional()
      .refine(isValidISODate, { message: 'Fecha de fin inválida' }),

    status: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED']).optional(),
  })
  .strip()
  .superRefine((data, ctx) => {
    const hasAnyValue = Object.values(data).some((v) => v !== undefined)
    if (!hasAnyValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe proporcionar al menos un campo para actualizar',
      })
    }
  })

export type PolicyEditFormData = z.infer<typeof policyUpdateSchema>
