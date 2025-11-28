/**
 * Invite Affiliate form validation schema
 * Mirrors backend: api/src/features/invitations/new/inviteAffiliate.schema.ts
 */

import { z } from 'zod'

/**
 * Zod schema for invite single affiliate form
 */
export const inviteAffiliateSchema = z.object({
  /** Affiliate ID to invite */
  affiliateId: z
    .string()
    .min(1, 'El afiliado es requerido'),

  /** Role ID to assign */
  roleId: z
    .string()
    .min(1, 'El rol es requerido'),
})

/**
 * Inferred TypeScript type for form data
 */
export type InviteAffiliateFormData = z.infer<typeof inviteAffiliateSchema>

/**
 * Zod schema for bulk invite affiliates form
 */
export const inviteAffiliatesBulkSchema = z.object({
  /** Array of affiliate IDs to invite */
  affiliateIds: z
    .array(z.string())
    .min(1, 'Seleccione al menos un afiliado'),

  /** Role ID to assign to all affiliates */
  roleId: z
    .string()
    .min(1, 'El rol es requerido'),
})

/**
 * Inferred TypeScript type for bulk form data
 */
export type InviteAffiliatesBulkFormData = z.infer<typeof inviteAffiliatesBulkSchema>
