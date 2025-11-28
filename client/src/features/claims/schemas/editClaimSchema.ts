/**
 * Validation schema for claim editing
 *
 * Mirrors backend validation from: api/src/features/claims/edit/claimEdit.schema.ts
 *
 * Key differences from backend:
 * - Dates kept as strings (not coerced to Date objects)
 * - Frontend sends ISO 8601 strings, backend parses them
 *
 * Used by:
 * - EditClaimModal form validation (react-hook-form)
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
 * Claim update validation schema
 *
 * All fields optional (partial update pattern).
 * Null values allowed (clear fields).
 * At least one field must be provided (empty updates rejected).
 */
export const claimUpdateSchema = z
  .object({
    /** Claim description/narrative (3-5000 chars, can be null to clear) */
    description: z
      .string({ message: 'La descripción debe ser texto' })
      .trim()
      .min(3, 'La descripción debe tener al menos 3 caracteres')
      .max(5000, 'La descripción no puede exceder 5000 caracteres')
      .nullable()
      .optional()
      .or(z.literal('')),

    // ============================================================================
    // DIAGNOSIS FIELDS
    // ============================================================================

    /** Type of care (Ambulatory, Hospitalization, etc.) */
    careType: z
      .enum(['AMBULATORY', 'HOSPITALIZATION', 'MATERNITY', 'EMERGENCY', 'OTHER'], {
        message: 'Tipo de atención inválido',
      })
      .nullable()
      .optional()
      .or(z.literal('')),

    /** ICD diagnosis code */
    diagnosisCode: z
      .string({ message: 'El código de diagnóstico debe ser texto' })
      .trim()
      .max(20, 'El código de diagnóstico no puede exceder 20 caracteres')
      .nullable()
      .optional()
      .or(z.literal('')),

    /** Diagnosis description */
    diagnosisDescription: z
      .string({ message: 'La descripción del diagnóstico debe ser texto' })
      .trim()
      .max(1000, 'La descripción del diagnóstico no puede exceder 1000 caracteres')
      .nullable()
      .optional()
      .or(z.literal('')),

    // ============================================================================
    // FINANCIAL FIELDS
    // ============================================================================

    /** Amount submitted (string in form, converted to number in mapper) */
    amountSubmitted: z
      .string({ message: 'El monto debe ser un número' })
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true
          const cleaned = val.replace(/[^0-9.-]/g, '').replace(',', '.')
          const num = parseFloat(cleaned)
          return !isNaN(num) && num >= 0
        },
        { message: 'El monto debe ser un número válido mayor o igual a 0' }
      ),

    /** Amount approved (string in form, converted to number in mapper) */
    amountApproved: z
      .string({ message: 'El monto aprobado debe ser un número' })
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true
          const cleaned = val.replace(/[^0-9.-]/g, '').replace(',', '.')
          const num = parseFloat(cleaned)
          return !isNaN(num) && num >= 0
        },
        { message: 'El monto aprobado debe ser un número válido mayor o igual a 0' }
      ),

    /** Amount denied (string in form, converted to number in mapper) */
    amountDenied: z
      .string({ message: 'El monto denegado debe ser un número' })
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true
          const cleaned = val.replace(/[^0-9.-]/g, '').replace(',', '.')
          const num = parseFloat(cleaned)
          return !isNaN(num) && num >= 0
        },
        { message: 'El monto denegado debe ser un número válido mayor o igual a 0' }
      ),

    /** Amount unprocessed (string in form, converted to number in mapper) */
    amountUnprocessed: z
      .string({ message: 'El monto no procesado debe ser un número' })
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true
          const cleaned = val.replace(/[^0-9.-]/g, '').replace(',', '.')
          const num = parseFloat(cleaned)
          return !isNaN(num) && num >= 0
        },
        { message: 'El monto no procesado debe ser un número válido mayor o igual a 0' }
      ),

    /** Deductible applied (string in form, converted to number in mapper) */
    deductibleApplied: z
      .string({ message: 'El deducible debe ser un número' })
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true
          const cleaned = val.replace(/[^0-9.-]/g, '').replace(',', '.')
          const num = parseFloat(cleaned)
          return !isNaN(num) && num >= 0
        },
        { message: 'El deducible debe ser un número válido mayor o igual a 0' }
      ),

    /** Copay applied (string in form, converted to number in mapper) */
    copayApplied: z
      .string({ message: 'El copago debe ser un número' })
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true
          const cleaned = val.replace(/[^0-9.-]/g, '').replace(',', '.')
          const num = parseFloat(cleaned)
          return !isNaN(num) && num >= 0
        },
        { message: 'El copago debe ser un número válido mayor o igual a 0' }
      ),

    // ============================================================================
    // DATE FIELDS
    // ============================================================================

    /** When the incident occurred (ISO 8601 date string) */
    incidentDate: z
      .string({ message: 'La fecha de incurrencia debe ser texto' })
      .optional()
      .refine(isValidISODate, { message: 'Fecha inválida' }),

    /** When the claim was submitted (ISO 8601 date string) */
    submittedDate: z
      .string({ message: 'La fecha de presentación debe ser texto' })
      .optional()
      .refine(isValidISODate, { message: 'Fecha inválida' }),

    /** When the claim was settled (ISO 8601 date string) */
    settlementDate: z
      .string({ message: 'La fecha de liquidación debe ser texto' })
      .optional()
      .refine(isValidISODate, { message: 'Fecha inválida' }),

    // ============================================================================
    // SETTLEMENT FIELDS
    // ============================================================================

    /** Settlement number from insurer */
    settlementNumber: z
      .string({ message: 'El número de liquidación debe ser texto' })
      .trim()
      .max(100, 'El número de liquidación no puede exceder 100 caracteres')
      .nullable()
      .optional()
      .or(z.literal('')),

    /** Settlement notes/observations */
    settlementNotes: z
      .string({ message: 'Las observaciones deben ser texto' })
      .trim()
      .max(2000, 'Las observaciones no pueden exceder 2000 caracteres')
      .nullable()
      .optional()
      .or(z.literal('')),

    /** Business days tracking */
    businessDays: z
      .string({ message: 'Los días laborables deben ser un número' })
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true
          const num = parseInt(val, 10)
          return !isNaN(num) && num >= 0
        },
        { message: 'Los días laborables deben ser un número entero mayor o igual a 0' }
      ),

    // ============================================================================
    // REFERENCE FIELDS
    // ============================================================================

    /** Policy ID covering this claim (CUID format, can be null to clear) */
    policyId: z.string().cuid('ID de póliza inválido').nullable().optional().or(z.literal('')),

    // ============================================================================
    // STATUS TRANSITION
    // ============================================================================

    /** New claim status (triggers lifecycle validation) */
    status: z
      .enum(['DRAFT', 'PENDING_INFO', 'VALIDATION', 'SUBMITTED', 'RETURNED', 'SETTLED', 'CANCELLED'], {
        message: 'Estado inválido',
      })
      .optional(),
  })
  .strip() // Ignore unknown fields
  .superRefine((data, ctx) => {
    // Reject empty updates (at least one field must have a defined value)
    // Allows null (intentional clears), rejects all-undefined
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
 * Should match ClaimUpdateRequest from types
 */
export type ClaimUpdateFormData = z.infer<typeof claimUpdateSchema>
