/**
 * Validation schema for improving text with AI (POST /api/ai/improve-text)
 */

import { z } from 'zod'

/**
 * Body validation schema for improving text
 *
 * Validation rules:
 * - text: required, 1-5000 chars, trimmed
 * - context: optional, enum (support-reply | general), defaults to support-reply
 *
 * Unknown fields are stripped (ignored).
 */
export const improveTextSchema = z
  .object({
    /** Text to improve (required) */
    text: z
      .string({ message: 'El texto es requerido' })
      .trim()
      .min(1, 'El texto es requerido')
      .max(5000, 'El texto no puede exceder 5000 caracteres'),

    /** Context for improvement style (optional) */
    context: z
      .enum(['support-reply', 'general'])
      .optional()
      .default('support-reply'),
  })
  .strip() // Ignore unknown fields

/**
 * Input type (before Zod parsing)
 */
export type ImproveTextInput = z.input<typeof improveTextSchema>

/**
 * Output type (after Zod parsing/transformation)
 */
export type ImproveTextParsed = z.output<typeof improveTextSchema>
