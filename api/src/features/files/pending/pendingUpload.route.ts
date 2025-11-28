/**
 * pendingUpload.route.ts
 * Route for requesting presigned upload URLs for pending files
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { pendingUploadSchema } from './pendingUpload.schema.js'
import { requestPendingUploadUrl } from './pendingUpload.service.js'

const router = Router()

/**
 * POST /api/files/pending-upload-url
 * Request a presigned URL for uploading a pending file
 *
 * Pending files are uploaded BEFORE the entity (claim/ticket) exists.
 * They will be linked to the entity when it's created.
 */
router.post(
  '/files/pending-upload-url',
  requireAuth,
  validateRequest({ body: pendingUploadSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }

    const response = await requestPendingUploadUrl(user.id, req.body)

    res.status(200).json(response)
  })
)

export default router
