/**
 * claimFiles.route.ts
 * Route for listing claim files
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { claimFilesParamsSchema } from './claimFiles.schema.js'
import { getClaimFiles } from './claimFiles.service.js'

const router = Router()

/**
 * GET /api/claims/:claimId/files
 * List all files attached to a claim
 */
router.get(
  '/claims/:claimId/files',
  requireAuth,
  validateRequest({ params: claimFilesParamsSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }

    const response = await getClaimFiles(user.id, req.params.claimId)

    res.status(200).json(response)
  })
)

export default router
