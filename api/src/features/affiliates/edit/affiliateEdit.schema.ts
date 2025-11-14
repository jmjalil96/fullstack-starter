/**
 * Validation schema for affiliate editing endpoint (PUT /api/affiliates/:id)
 *
 * Validates partial updates to affiliates with:
 * - Type checking (string, boolean, date, enum)
 * - Format validation (email format, CUID format)
 * - Value constraints (min/max lengths)
 * - Spanish error messages
 * - At least one field required (empty updates rejected)
 *
 * Much simpler than policies/claims - no lifecycle/status validation needed.
 * Cross-field validation (email required for OWNER, primaryAffiliateId for DEPENDENT)
 * is handled in the service layer to check against current affiliate state.
 */

import { z } from 'zod'

/**
 * Body validation schema for affiliate updates
 *
 * All fields optional (partial update pattern).
 * Unknown fields are stripped (ignored).
 * At least one field must be provided (empty updates rejected).
 *
 * Nullable fields:
 * - email, phone, documentType, documentNumber, dateOfBirth can be set to null to clear the value
 * - coverageType, primaryAffiliateId can be set to null for OWNER affiliates
 * - firstName, lastName, affiliateType, isActive cannot be null (required in database)
 */
export const updateAffiliateSchema = z
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
      .max(255)
      .nullable()
      .optional(),

    /** Contact phone (7-20 chars, can be null to clear) */
    phone: z
      .string()
      .trim()
      .min(7, 'El teléfono debe tener al menos 7 caracteres')
      .max(20, 'El teléfono no puede exceder 20 caracteres')
      .nullable()
      .optional(),

    /** Document type (e.g., DNI, RUC, Passport, can be null to clear) */
    documentType: z
      .string()
      .trim()
      .max(50, 'El tipo de documento no puede exceder 50 caracteres')
      .nullable()
      .optional(),

    /** Document number (unique per affiliate, can be null to clear) */
    documentNumber: z
      .string()
      .trim()
      .max(50, 'El número de documento no puede exceder 50 caracteres')
      .nullable()
      .optional(),

    /** Date of birth (can be null to clear) */
    dateOfBirth: z
      .coerce
      .date({ message: 'Fecha de nacimiento inválida' })
      .nullable()
      .optional(),

    /** Affiliate type: OWNER or DEPENDENT */
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
      .nullable()
      .optional(),

    /** CUID of primary affiliate (required for DEPENDENTs, null for OWNERs) */
    primaryAffiliateId: z
      .string()
      .cuid('ID de afiliado principal inválido')
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
    const hasAnyValue = Object.values(data).some((v) => v !== undefined)
    if (!hasAnyValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe proporcionar al menos un campo para actualizar',
      })
    }
  })

/**
 * Input type (before Zod parsing/coercion)
 */
export type UpdateAffiliateInput = z.input<typeof updateAffiliateSchema>

/**
 * Output type (after Zod parsing/coercion)
 */
export type UpdateAffiliateParsed = z.output<typeof updateAffiliateSchema>
