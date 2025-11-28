/**
 * Validation schema for claim editing endpoint (PUT /api/claims/:id)
 *
 * Validates partial updates to claims with:
 * - Type checking (string, number, date)
 * - Format validation (CUID, ISO dates)
 * - Value constraints (min/max, nonnegative)
 * - Spanish error messages
 *
 * Note: Blueprint validation happens after Zod validation in service layer
 * (field editability, status transitions, required fields for transitions)
 */

import { z } from 'zod'

import { CLAIM_STATUS_ENUM } from '../views/viewClaims.schema.js'

/**
 * CareType enum for validation
 */
export const CARE_TYPE_ENUM = [
  'AMBULATORY',
  'HOSPITALIZATION',
  'MATERNITY',
  'EMERGENCY',
  'OTHER',
] as const

/**
 * Body validation schema for claim updates
 *
 * All fields optional (partial update pattern).
 * Unknown fields are stripped (ignored).
 * At least one field must be provided (empty updates rejected).
 *
 * Date handling:
 * - Input expects ISO 8601 strings
 * - Coerced to Date objects for service layer
 * - Use z.input<> for input type, z.output<> for parsed type
 *
 * Nullable fields:
 * - Can be set to null to clear the value
 * - Validated with .nullable().optional() chain
 */
export const claimUpdateSchema = z
  .object({
    // ============================================================================
    // BASIC FIELDS (editable in DRAFT, VALIDATION, PENDING_INFO)
    // ============================================================================

    /** Claim description/narrative (3-5000 chars, can be null to clear) */
    description: z
      .string({ message: 'La descripción debe ser texto' })
      .trim()
      .min(3, 'La descripción debe tener al menos 3 caracteres')
      .max(5000, 'La descripción no puede exceder 5000 caracteres')
      .nullable()
      .optional(),

    /** Type of care */
    careType: z
      .enum(CARE_TYPE_ENUM, { message: 'Tipo de atención inválido' })
      .nullable()
      .optional(),

    /** ICD diagnosis code */
    diagnosisCode: z
      .string({ message: 'El código de diagnóstico debe ser texto' })
      .trim()
      .max(20, 'El código de diagnóstico no puede exceder 20 caracteres')
      .nullable()
      .optional(),

    /** Diagnosis description text */
    diagnosisDescription: z
      .string({ message: 'La descripción del diagnóstico debe ser texto' })
      .trim()
      .max(1000, 'La descripción del diagnóstico no puede exceder 1000 caracteres')
      .nullable()
      .optional(),

    /** Total amount submitted for reimbursement (must be >= 0) */
    amountSubmitted: z
      .number({ message: 'El monto presentado debe ser un número' })
      .nonnegative('El monto presentado debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** When the incident occurred (ISO 8601 date string) */
    incidentDate: z
      .coerce.date({ message: 'Fecha de incidente inválida (use formato ISO 8601)' })
      .optional(),

    /** When the claim was submitted to insurer (ISO 8601 date string) */
    submittedDate: z
      .coerce.date({ message: 'Fecha de presentación inválida (use formato ISO 8601)' })
      .optional(),

    /** Policy ID covering this claim (CUID format, can be null to clear) */
    policyId: z.string().cuid('ID de póliza inválido').nullable().optional(),

    // ============================================================================
    // TRACKING FIELDS (editable in SUBMITTED, PENDING_INFO)
    // ============================================================================

    /** Business days tracking */
    businessDays: z
      .number({ message: 'Los días laborables deben ser un número' })
      .int('Los días laborables deben ser un número entero')
      .nonnegative('Los días laborables deben ser mayor o igual a 0')
      .nullable()
      .optional(),

    // ============================================================================
    // SETTLEMENT FIELDS (required for SUBMITTED → SETTLED transition)
    // ============================================================================

    /** Gastos No Elegibles - amount denied by insurer */
    amountDenied: z
      .number({ message: 'El monto denegado debe ser un número' })
      .nonnegative('El monto denegado debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Gastos No Procesados - unprocessed amount */
    amountUnprocessed: z
      .number({ message: 'El monto no procesado debe ser un número' })
      .nonnegative('El monto no procesado debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Aplicación de Deducible - deductible applied */
    deductibleApplied: z
      .number({ message: 'El deducible aplicado debe ser un número' })
      .nonnegative('El deducible aplicado debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Copago - copay applied */
    copayApplied: z
      .number({ message: 'El copago aplicado debe ser un número' })
      .nonnegative('El copago aplicado debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    /** Fecha de Liquidación - settlement date (ISO date string) */
    settlementDate: z
      .coerce.date({ message: 'Fecha de liquidación inválida (use formato ISO 8601)' })
      .optional(),

    /** Número de Liquidación - settlement number from insurer */
    settlementNumber: z
      .string({ message: 'El número de liquidación debe ser texto' })
      .trim()
      .max(100, 'El número de liquidación no puede exceder 100 caracteres')
      .nullable()
      .optional(),

    /** Observaciones - settlement notes */
    settlementNotes: z
      .string({ message: 'Las notas de liquidación deben ser texto' })
      .trim()
      .max(2000, 'Las notas de liquidación no pueden exceder 2000 caracteres')
      .nullable()
      .optional(),

    /** Liquidado - approved amount */
    amountApproved: z
      .number({ message: 'El monto aprobado debe ser un número' })
      .nonnegative('El monto aprobado debe ser mayor o igual a 0')
      .nullable()
      .optional(),

    // ============================================================================
    // REPROCESS FIELDS (required for PENDING_INFO → SUBMITTED transition)
    // ============================================================================

    /** Date when claim was reprocessed (ISO date string) */
    reprocessDate: z
      .coerce.date({ message: 'Fecha de reproceso inválida (use formato ISO 8601)' })
      .optional(),

    /** Description of why reprocessing was needed */
    reprocessDescription: z
      .string({ message: 'La descripción del reproceso debe ser texto' })
      .trim()
      .min(3, 'La descripción del reproceso debe tener al menos 3 caracteres')
      .max(2000, 'La descripción del reproceso no puede exceder 2000 caracteres')
      .optional(),

    // ============================================================================
    // STATUS TRANSITION
    // ============================================================================

    /** New claim status (triggers lifecycle validation) */
    status: z
      .enum(CLAIM_STATUS_ENUM, {
        message: 'Estado inválido',
      })
      .optional(),
  })
  .strip() // Ignore unknown fields
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
 * Input type (pre-parse) - Matches DTO with ISO strings
 * This is what the client sends (dates as ISO 8601 strings)
 */
export type ClaimUpdateInput = z.input<typeof claimUpdateSchema>

/**
 * Output type (post-parse) - What service layer receives
 * Dates are coerced to Date objects by Zod
 */
export type ClaimUpdateParsed = z.output<typeof claimUpdateSchema>
