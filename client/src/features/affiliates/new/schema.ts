/**
 * Affiliate form validation schema
 * Mirrors backend: api/src/features/affiliates/new/createAffiliate.schema.ts
 */

import { z } from 'zod'

/**
 * Zod schema for affiliate creation form
 *
 * Mirrors backend validation exactly to provide instant client-side feedback.
 * Backend will re-validate for security.
 */
export const affiliateFormSchema = z
  .object({
    /** Client ID (required, CUID format) */
    clientId: z.string().cuid('ID de cliente inválido'),

    /** Affiliate first name (2-100 chars) */
    firstName: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),

    /** Affiliate last name (2-100 chars) */
    lastName: z
      .string()
      .trim()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(100, 'El apellido no puede exceder 100 caracteres'),

    /** Contact email (optional, valid format, max 255 chars) */
    email: z
      .string()
      .trim()
      .email('Formato de correo electrónico inválido')
      .max(255, 'El correo no puede exceder 255 caracteres')
      .optional()
      .or(z.literal('')), // Allow empty string (converted to undefined on submit)

    /** Contact phone (optional, 7-20 chars) */
    phone: z
      .string()
      .trim()
      .min(7, 'El teléfono debe tener al menos 7 caracteres')
      .max(20, 'El teléfono no puede exceder 20 caracteres')
      .optional()
      .or(z.literal('')), // Allow empty string

    /** Date of birth (optional) */
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

    /** Affiliate type: OWNER (titular) or DEPENDENT (dependiente) */
    affiliateType: z.enum(['OWNER', 'DEPENDENT'], {
      message: 'Tipo de afiliado inválido',
    }),

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
  })
  .refine(
    (data) => {
      // If OWNER, email must be present
      if (data.affiliateType === 'OWNER') {
        return data.email && data.email.length > 0
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
      // If DEPENDENT, primaryAffiliateId must be present
      if (data.affiliateType === 'DEPENDENT') {
        return data.primaryAffiliateId && data.primaryAffiliateId.length > 0
      }
      return true
    },
    {
      message:
        'El ID del afiliado principal es obligatorio para afiliados dependientes',
      path: ['primaryAffiliateId'],
    }
  )
  .refine(
    (data) => {
      // If OWNER, primaryAffiliateId must NOT be present
      if (data.affiliateType === 'OWNER') {
        return !data.primaryAffiliateId || data.primaryAffiliateId.length === 0
      }
      return true
    },
    {
      message:
        'Los afiliados titulares no pueden tener un afiliado principal',
      path: ['primaryAffiliateId'],
    }
  )

/**
 * Inferred TypeScript type for form data
 */
export type AffiliateFormData = z.infer<typeof affiliateFormSchema>
