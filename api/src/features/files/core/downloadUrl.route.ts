/**
 * downloadUrl.route.ts
 * Route for requesting presigned download URLs
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { downloadUrlParamsSchema } from './downloadUrl.schema.js'
import { requestDownloadUrl } from './downloadUrl.service.js'

const router = Router()

/**
 * GET /api/files/:id/download-url
 * Request a presigned URL for downloading a file
 */
router.get(
  '/files/:id/download-url',
  requireAuth,
  validateRequest({ params: downloadUrlParamsSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }

    const response = await requestDownloadUrl(user.id, req.params.id)

    res.status(200).json(response)
  })
)

export default router
