/**
 * auditLogs.schema.ts
 * Zod validation schemas for claim audit logs endpoint
 */

import { z } from 'zod'

// ============================================================================
// PATH PARAMETERS
// ============================================================================

export const auditLogsParamSchema = z.object({
  id: z.string().cuid('ID de reclamo inválido'),
})

export type AuditLogsParam = z.infer<typeof auditLogsParamSchema>

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

export const auditLogsQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .min(1, 'Página debe ser mayor o igual a 1')
      .default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1, 'Límite debe estar entre 1 y 100')
      .max(100, 'Límite debe estar entre 1 y 100')
      .default(50),
  })
  .strip()

export type AuditLogsQuery = z.infer<typeof auditLogsQuerySchema>
