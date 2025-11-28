/**
 * deleteFile.route.ts
 * Route for soft deleting files
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { deleteFileParamsSchema } from './deleteFile.schema.js'
import { deleteFile } from './deleteFile.service.js'

const router = Router()

/**
 * DELETE /api/files/:id
 * Soft delete a file
 */
router.delete(
  '/files/:id',
  requireAuth,
  validateRequest({ params: deleteFileParamsSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }

    const response = await deleteFile(user.id, req.params.id)

    res.status(200).json(response)
  })
)

export default router
