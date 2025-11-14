/**
 * Validation schema for creating affiliates
 */

import { z } from 'zod'

/**
 * Request body validation for POST /api/affiliates
 *
 * All string fields are trimmed.
 * Spanish error messages are used throughout.
 * Unknown fields are stripped.
 *
 * Cross-field validation rules:
 * - If affiliateType is 'DEPENDENT', primaryAffiliateId must be provided
 * - If affiliateType is 'OWNER', primaryAffiliateId must NOT be provided
 * - If affiliateType is 'OWNER', email must be provided
 */
export const createAffiliateSchema = z
  .object({
    /** Client ID that this affiliate belongs to */
    clientId: z.string().cuid('ID de cliente inválido'),

    /** Affiliate's first name (2-200 chars) */
    firstName: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(200, 'El nombre no puede exceder 200 caracteres'),

    /** Affiliate's last name (2-200 chars) */
    lastName: z
      .string()
      .trim()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(200, 'El apellido no puede exceder 200 caracteres'),

    /** Contact email (required for OWNER, optional for DEPENDENT) */
    email: z
      .string()
      .trim()
      .email('Formato de correo electrónico inválido')
      .max(255, 'El correo no puede exceder 255 caracteres')
      .optional(),

    /** Contact phone number (optional, max 50 chars) */
    phone: z
      .string()
      .trim()
      .max(50, 'El teléfono no puede exceder 50 caracteres')
      .optional(),

    /** Date of birth (optional, ISO 8601 format) */
    dateOfBirth: z
      .coerce
      .date({ message: 'Fecha de nacimiento inválida (use formato ISO 8601)' })
      .optional(),

    /** Document type (optional, max 50 chars) */
    documentType: z
      .string()
      .trim()
      .max(50, 'El tipo de documento no puede exceder 50 caracteres')
      .optional(),

    /** Document number (optional, max 50 chars) */
    documentNumber: z
      .string()
      .trim()
      .max(50, 'El número de documento no puede exceder 50 caracteres')
      .optional(),

    /** Type of affiliate (OWNER or DEPENDENT) */
    affiliateType: z.enum(['OWNER', 'DEPENDENT'], {
      message: 'Tipo de afiliado inválido',
    }),

    /** Coverage type (optional) */
    coverageType: z
      .enum(['T', 'TPLUS1', 'TPLUSF'], {
        message: 'Tipo de cobertura inválido',
      })
      .optional(),

    /** Primary affiliate ID (required for dependents, forbidden for owners) */
    primaryAffiliateId: z
      .string()
      .cuid('ID de afiliado principal inválido')
      .optional(),
  })
  .strip()
  .refine(
    (data) => {
      // If affiliate is a DEPENDENT, primaryAffiliateId must be provided
      if (data.affiliateType === 'DEPENDENT') {
        return !!data.primaryAffiliateId
      }
      return true
    },
    {
      message: 'Afiliado principal es requerido para dependientes',
      path: ['primaryAffiliateId'],
    }
  )
  .refine(
    (data) => {
      // If affiliate is an OWNER, primaryAffiliateId must NOT be provided
      if (data.affiliateType === 'OWNER') {
        return !data.primaryAffiliateId
      }
      return true
    },
    {
      message: 'Afiliado titular no puede tener afiliado principal',
      path: ['primaryAffiliateId'],
    }
  )
  .refine(
    (data) => {
      // If affiliate is an OWNER, email must be provided
      if (data.affiliateType === 'OWNER') {
        return !!data.email
      }
      return true
    },
    {
      message: 'Correo electrónico es requerido para titulares',
      path: ['email'],
    }
  )

/**
 * Inferred TypeScript type from schema
 */
export type CreateAffiliateInput = z.infer<typeof createAffiliateSchema>
