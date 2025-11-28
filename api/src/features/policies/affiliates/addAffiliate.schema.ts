/**
 * Validation schema for creating and adding an affiliate to a policy
 */

import { z } from 'zod'

/**
 * Affiliate type enum
 */
const affiliateTypeEnum = z.enum(['OWNER', 'DEPENDENT'], {
  message: 'Tipo de afiliado inválido'
})

/**
 * Coverage type enum
 */
const coverageTypeEnum = z.enum(['T', 'TPLUS1', 'TPLUSF'], {
  message: 'Tipo de cobertura inválido'
})

/**
 * Request body validation for POST /api/policies/:policyId/affiliates
 *
 * Creates a new affiliate with all required validations.
 * Includes cross-field validation for OWNER/DEPENDENT requirements.
 *
 * Unknown fields are stripped via .strict()
 */
export const addAffiliateToPolicySchema = z
  .object({
    /** Client ID (must match policy's client) */
    clientId: z
      .string()
      .cuid('ID de cliente inválido'),

    /** First name */
    firstName: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(200, 'El nombre no puede exceder 200 caracteres'),

    /** Last name */
    lastName: z
      .string()
      .trim()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(200, 'El apellido no puede exceder 200 caracteres'),

    /** Affiliate type */
    affiliateType: affiliateTypeEnum,

    /** Email (required for OWNER, optional for DEPENDENT) */
    email: z
      .string()
      .trim()
      .email('Formato de correo electrónico inválido')
      .max(255, 'El correo no puede exceder 255 caracteres')
      .optional()
      .or(z.literal('')),

    /** Phone number */
    phone: z
      .string()
      .trim()
      .max(50, 'El teléfono no puede exceder 50 caracteres')
      .optional()
      .or(z.literal('')),

    /** Date of birth */
    dateOfBirth: z.coerce
      .date({ message: 'Fecha de nacimiento inválida' })
      .optional(),

    /** Document type */
    documentType: z
      .string()
      .trim()
      .max(50, 'El tipo de documento no puede exceder 50 caracteres')
      .optional()
      .or(z.literal('')),

    /** Document number */
    documentNumber: z
      .string()
      .trim()
      .max(50, 'El número de documento no puede exceder 50 caracteres')
      .optional()
      .or(z.literal('')),

    /** Coverage type */
    coverageType: coverageTypeEnum.optional(),

    /** Primary affiliate ID (required for DEPENDENT) */
    primaryAffiliateId: z
      .string()
      .cuid('ID de afiliado principal inválido')
      .optional()
      .or(z.literal('')),

    /** Date when affiliate joins the policy (required) */
    addedAt: z.coerce
      .date({ message: 'Fecha de incorporación inválida' })
      .refine(
        (val) => val <= new Date(),
        { message: 'La fecha de incorporación no puede ser futura' }
      ),
  })
  .strict() // Strip unknown fields
  .refine(
    // OWNER must have email
    (data) => {
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
    // DEPENDENT must have primaryAffiliateId
    (data) => {
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
    // OWNER cannot have primaryAffiliateId
    (data) => {
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

/**
 * Inferred TypeScript type from the Zod schema
 * Use this type in the service layer after validation
 */
export type AddAffiliateToPolicyInput = z.infer<typeof addAffiliateToPolicySchema>

/**
 * Parsed type with processed values
 * Converts empty strings to undefined/null as needed
 */
export type AddAffiliateToPolicyParsed = {
  clientId: string
  firstName: string
  lastName: string
  affiliateType: 'OWNER' | 'DEPENDENT'
  email?: string
  phone?: string
  dateOfBirth?: string
  documentType?: string
  documentNumber?: string
  coverageType?: 'T' | 'TPLUS1' | 'TPLUSF'
  primaryAffiliateId?: string
  addedAt?: string
}