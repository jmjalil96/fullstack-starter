/**
 * uploadUrl.route.ts
 * Route for requesting presigned upload URLs
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { uploadUrlSchema } from './uploadUrl.schema.js'
import { requestUploadUrl } from './uploadUrl.service.js'

const router = Router()

/**
 * POST /api/files/upload-url
 * Request a presigned URL for direct upload to R2
 */
router.post(
  '/files/upload-url',
  requireAuth,
  validateRequest({ body: uploadUrlSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }

    const response = await requestUploadUrl(user.id, req.body)

    res.status(200).json(response)
  })
)

export default router
