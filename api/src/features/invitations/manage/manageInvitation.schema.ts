/**
 * Validation schemas for managing invitations (resend, revoke)
 */

import { z } from 'zod'

/**
 * Path parameter validation for invitation management endpoints
 */
export const invitationIdParamSchema = z.object({
  id: z.string().cuid('ID de invitación inválido'),
})

/**
 * Inferred TypeScript type from schema
 */
export type InvitationIdParam = z.infer<typeof invitationIdParamSchema>
