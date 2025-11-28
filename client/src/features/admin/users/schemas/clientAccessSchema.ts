/**
 * Client Access form validation schema
 * For assigning clients to affiliate users (CLIENT_ADMIN role)
 */

import { z } from 'zod'

/**
 * Zod schema for client access form
 */
export const clientAccessSchema = z.object({
  /** Array of client IDs to grant access to (can be empty to remove all access) */
  clientIds: z.array(z.string()),
})

/**
 * Inferred TypeScript type for form data
 */
export type ClientAccessFormData = z.infer<typeof clientAccessSchema>
