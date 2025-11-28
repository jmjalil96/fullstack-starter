/**
 * Validation schemas for inviting affiliates
 */

import { z } from 'zod'

/**
 * Request body validation for POST /api/invitations/affiliate
 */
export const inviteAffiliateSchema = z
  .object({
    /** Affiliate ID to invite */
    affiliateId: z
      .string({ message: 'El ID del afiliado es requerido' })
      .cuid('ID de afiliado inválido'),

    /** Role ID to assign upon acceptance */
    roleId: z
      .string({ message: 'El rol es requerido' })
      .cuid('ID de rol inválido'),
  })
  .strip()

/**
 * Inferred TypeScript type from schema
 */
export type InviteAffiliateInput = z.infer<typeof inviteAffiliateSchema>

/**
 * Request body validation for POST /api/invitations/affiliates/bulk
 */
export const inviteAffiliatesBulkSchema = z
  .object({
    /** Array of affiliate IDs to invite */
    affiliateIds: z
      .array(z.string().cuid('ID de afiliado inválido'), {
        message: 'Se requiere al menos un afiliado',
      })
      .min(1, 'Se requiere al menos un afiliado')
      .max(50, 'Máximo 50 afiliados por solicitud'),

    /** Role ID to assign to all upon acceptance */
    roleId: z
      .string({ message: 'El rol es requerido' })
      .cuid('ID de rol inválido'),
  })
  .strip()

/**
 * Inferred TypeScript type from schema
 */
export type InviteAffiliatesBulkInput = z.infer<typeof inviteAffiliatesBulkSchema>
