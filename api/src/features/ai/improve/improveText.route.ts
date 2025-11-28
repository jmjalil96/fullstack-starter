/**
 * improveText.route.ts
 * Route for improving text with AI
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { improveTextSchema, type ImproveTextParsed } from './improveText.schema.js'
import { improveText } from './improveText.service.js'

const router = Router()

/**
 * POST /api/ai/improve-text
 * Improve text using AI (grammar correction, professional tone)
 *
 * Request body:
 * - text (required): Text to improve (1-5000 chars)
 * - context (optional): Context for improvement style ('support-reply' | 'general')
 *
 * Authorization:
 * - Any authenticated user
 */
router.post(
  '/ai/improve-text',
  requireAuth,
  validateRequest({ body: improveTextSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }
    const userId = user.id

    const data = req.body as ImproveTextParsed

    const result = await improveText(userId, data)

    res.status(200).json(result)
  })
)

export default router
