/**
 * Validation schema for agent editing
 *
 * Mirrors backend validation from: api/src/features/agents/edit/editAgent.schema.ts
 *
 * Used by:
 * - EditAgentModal form validation (react-hook-form)
 */

import { z } from 'zod'

/**
 * Agent update validation schema
 *
 * All fields optional (partial update pattern).
 * Null values allowed for nullable fields (phone, agentCode).
 * At least one field must be provided (empty updates rejected).
 */
export const updateAgentSchema = z
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

    /** Agent code (2-50 chars, can be null to clear) */
    agentCode: z
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
export type AgentUpdateFormData = z.infer<typeof updateAgentSchema>
