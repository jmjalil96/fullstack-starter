/**
 * auditLogs.route.ts
 * Route for fetching claim audit logs
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { auditLogsParamSchema, auditLogsQuerySchema, type AuditLogsParam, type AuditLogsQuery } from './auditLogs.schema.js'
import { getClaimAuditLogs } from './auditLogs.service.js'

const router = Router()

/**
 * GET /api/claims/:id/audit-logs
 * Get audit logs for a specific claim
 *
 * Query params:
 * - page (default: 1): Page number
 * - limit (default: 50, max: 100): Items per page
 *
 * Returns audit logs based on user role authorization:
 * - AFFILIATE: Only their claims
 * - CLIENT_ADMIN: Claims from accessible clients
 * - BROKER EMPLOYEES: Any claim
 *
 * Security: Returns 404 if claim not found OR user lacks access
 */
router.get(
  '/claims/:id/audit-logs',
  requireAuth,
  validateRequest({ params: auditLogsParamSchema, query: auditLogsQuerySchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const { id } = req.params as AuditLogsParam
    const query = req.query as unknown as AuditLogsQuery

    const response = await getClaimAuditLogs(userId, id, query)

    res.status(200).json(response)
  })
)

export default router
