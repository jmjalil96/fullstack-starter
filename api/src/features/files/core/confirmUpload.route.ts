/**
 * confirmUpload.route.ts
 * Route for confirming file uploads
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { confirmUploadSchema } from './confirmUpload.schema.js'
import { confirmUpload } from './confirmUpload.service.js'

const router = Router()

/**
 * POST /api/files/confirm
 * Confirm a file upload and create File record
 */
router.post(
  '/files/confirm',
  requireAuth,
  validateRequest({ body: confirmUploadSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }

    const response = await confirmUpload(user.id, req.body)

    res.status(201).json(response)
  })
)

export default router
