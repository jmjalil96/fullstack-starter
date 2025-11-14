/**
 * Validation schema for affiliate editing
 *
 * Mirrors backend validation from: api/src/features/affiliates/edit/affiliateEdit.schema.ts
 *
 * Used by:
 * - EditAffiliateModal form validation (react-hook-form)
 */

import { z } from 'zod'

/**
 * Affiliate update validation schema
 *
 * All fields optional (partial update pattern).
 * Null values allowed for nullable fields (email, phone, documentType, documentNumber, dateOfBirth, coverageType, primaryAffiliateId).
 * At least one field must be provided (empty updates rejected).
 *
 * Cross-field validation notes:
 * - OWNER affiliates require email (validated in service layer against current state)
 * - DEPENDENT affiliates require primaryAffiliateId (validated in service layer)
 * - OWNER affiliates cannot have primaryAffiliateId (validated in service layer)
 */
export const affiliateUpdateSchema = z
  .object({
    /** Affiliate first name (2-100 chars) */
    firstName: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .optional(),

    /** Affiliate last name (2-100 chars) */
    lastName: z
      .string()
      .trim()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(100, 'El apellido no puede exceder 100 caracteres')
      .optional(),

    /** Contact email (valid format, can be null to clear) */
    email: z
      .string()
      .trim()
      .email('Formato de correo electrónico inválido')
      .max(255, 'El correo no puede exceder 255 caracteres')
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Contact phone (7-20 chars, can be null to clear) */
    phone: z
      .string()
      .trim()
      .min(7, 'El teléfono debe tener al menos 7 caracteres')
      .max(20, 'El teléfono no puede exceder 20 caracteres')
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Document type (e.g., DNI, RUC, Passport, can be null to clear) */
    documentType: z
      .string()
      .trim()
      .max(50, 'El tipo de documento no puede exceder 50 caracteres')
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Document number (unique per affiliate, can be null to clear) */
    documentNumber: z
      .string()
      .trim()
      .max(50, 'El número de documento no puede exceder 50 caracteres')
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Date of birth (can be null to clear) */
    dateOfBirth: z
      .string()
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Affiliate type: OWNER (titular) or DEPENDENT (dependiente) */
    affiliateType: z
      .enum(['OWNER', 'DEPENDENT'], {
        message: 'El tipo de afiliado debe ser OWNER o DEPENDENT',
      })
      .optional(),

    /** Coverage type: T (solo), TPLUS1 (pareja), TPLUSF (familia) */
    coverageType: z
      .enum(['T', 'TPLUS1', 'TPLUSF'], {
        message: 'El tipo de cobertura debe ser T, TPLUS1 o TPLUSF',
      })
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** CUID of primary affiliate (required for DEPENDENTs, null for OWNERs) */
    primaryAffiliateId: z
      .string()
      .cuid('ID de afiliado principal inválido')
      .or(z.literal(''))
      .nullable()
      .optional(),

    /** Whether affiliate is active */
    isActive: z
      .boolean({ message: 'El estado activo debe ser verdadero o falso' })
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
 * Should match AffiliateUpdateRequest from types
 */
export type AffiliateUpdateFormData = z.infer<typeof affiliateUpdateSchema>
