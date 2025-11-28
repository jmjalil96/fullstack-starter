/**
 * Add affiliate to policy form validation schema
 * Mirrors backend: api/src/features/policies/affiliates/addAffiliate.schema.ts
 */

import { z } from 'zod'

/**
 * Zod schema for adding affiliate to policy form
 *
 * Similar to regular affiliate creation but:
 * - clientId is required (will be prefilled from policy)
 * - Includes addedAt field for enrollment date
 * Mirrors backend validation exactly to provide instant client-side feedback.
 */
export const addAffiliateToPolicySchema = z
  .object({
    /** Client ID (required, prefilled from policy) */
    clientId: z.string().cuid('ID de cliente inválido'),

    /** Affiliate first name (2-200 chars) */
    firstName: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(200, 'El nombre no puede exceder 200 caracteres'),

    /** Affiliate last name (2-200 chars) */
    lastName: z
      .string()
      .trim()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(200, 'El apellido no puede exceder 200 caracteres'),

    /** Affiliate type: OWNER (titular) or DEPENDENT (dependiente) */
    affiliateType: z.enum(['OWNER', 'DEPENDENT'], {
      message: 'Tipo de afiliado inválido',
    }),

    /** Contact email (required for OWNER, optional for DEPENDENT) */
    email: z
      .string()
      .trim()
      .email('Formato de correo electrónico inválido')
      .max(255, 'El correo no puede exceder 255 caracteres')
      .optional()
      .or(z.literal('')), // Allow empty string

    /** Contact phone (optional) */
    phone: z
      .string()
      .trim()
      .max(50, 'El teléfono no puede exceder 50 caracteres')
      .optional()
      .or(z.literal('')), // Allow empty string

    /** Date of birth (optional, format: YYYY-MM-DD) */
    dateOfBirth: z
      .string()
      .optional()
      .or(z.literal('')), // Allow empty string

    /** Document type (optional, max 50 chars) */
    documentType: z
      .string()
      .trim()
      .max(50, 'El tipo de documento no puede exceder 50 caracteres')
      .optional()
      .or(z.literal('')), // Allow empty string

    /** Document number (optional, max 50 chars) */
    documentNumber: z
      .string()
      .trim()
      .max(50, 'El número de documento no puede exceder 50 caracteres')
      .optional()
      .or(z.literal('')), // Allow empty string

    /** Coverage type: T, TPLUS1, or TPLUSF (optional) */
    coverageType: z
      .enum(['T', 'TPLUS1', 'TPLUSF'], {
        message: 'Tipo de cobertura inválido',
      })
      .optional()
      .or(z.literal('')), // Allow empty string

    /** Primary affiliate ID (required for DEPENDENT, forbidden for OWNER) */
    primaryAffiliateId: z
      .string()
      .cuid('ID de afiliado principal inválido')
      .optional()
      .or(z.literal('')), // Allow empty string

    /** Date when affiliate joins the policy (required, format: YYYY-MM-DD) */
    addedAt: z
      .string()
      .min(1, 'La fecha de incorporación es obligatoria'),
  })
  .refine(
    (data) => {
      // OWNER must have email
      if (data.affiliateType === 'OWNER') {
        return !!(data.email && data.email.length > 0)
      }
      return true
    },
    {
      message: 'El correo electrónico es obligatorio para afiliados titulares',
      path: ['email'],
    }
  )
  .refine(
    (data) => {
      // DEPENDENT must have primaryAffiliateId
      if (data.affiliateType === 'DEPENDENT') {
        return !!(data.primaryAffiliateId && data.primaryAffiliateId.length > 0)
      }
      return true
    },
    {
      message: 'El ID del afiliado principal es obligatorio para afiliados dependientes',
      path: ['primaryAffiliateId'],
    }
  )
  .refine(
    (data) => {
      // OWNER cannot have primaryAffiliateId
      if (data.affiliateType === 'OWNER') {
        return !data.primaryAffiliateId || data.primaryAffiliateId.length === 0
      }
      return true
    },
    {
      message: 'Los afiliados titulares no pueden tener un afiliado principal',
      path: ['primaryAffiliateId'],
    }
  )
  .refine(
    (data) => {
      // addedAt cannot be in the future
      const addedDate = new Date(data.addedAt)
      const now = new Date()
      return addedDate <= now
    },
    {
      message: 'La fecha de incorporación no puede ser futura',
      path: ['addedAt'],
    }
  )

/**
 * Inferred TypeScript type for form data
 */
export type AddAffiliateToPolicyFormData = z.infer<typeof addAffiliateToPolicySchema>