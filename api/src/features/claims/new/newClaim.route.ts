/**
 * newClaim.route.ts
 * Route for creating new claims
 */

import { Router } from 'express'

import { env } from '../../../config/env.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
// import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import {
  availableAffiliatesQuerySchema,
  availablePatientsQuerySchema,
  createClaimSchema,
} from './newClaim.schema.js'
import {
  createClaim,
  getAvailableAffiliates,
  getAvailableClients,
  getAvailablePatients,
} from './newClaim.service.js'

const router = Router()

/**
 * GET /api/claims/available-clients
 * Get available clients for claim submission
 */
router.get(
  '/claims/available-clients',
  // TODO: UNCOMMENT BEFORE PRODUCTION!
  // requireAuth,
  asyncHandler(async (_req, res) => {
    // TODO: REMOVE MOCK - Use req.user.id when requireAuth is enabled
    const userId = env.TEST_USER_ID // Mock user for testing (remove in production)

    const clients = await getAvailableClients(userId)

    res.status(200).json(clients)
  })
)

/**
 * GET /api/claims/available-affiliates?clientId=X
 * Get available affiliates for a specific client
 */
router.get(
  '/claims/available-affiliates',
  // TODO: UNCOMMENT BEFORE PRODUCTION!
  // requireAuth,
  validateRequest({ query: availableAffiliatesQuerySchema }),
  asyncHandler(async (req, res) => {
    // TODO: REMOVE MOCK - Use req.user.id when requireAuth is enabled
    const userId = env.TEST_USER_ID // Mock user for testing (remove in production)

    // Zod validation ensures clientId is a string
    const { clientId } = req.query as { clientId: string }

    const affiliates = await getAvailableAffiliates(userId, clientId)

    res.status(200).json(affiliates)
  })
)

/**
 * GET /api/claims/available-patients?affiliateId=X
 * Get available patients for a specific affiliate (affiliate + dependents)
 */
router.get(
  '/claims/available-patients',
  // TODO: UNCOMMENT BEFORE PRODUCTION!
  // requireAuth,
  validateRequest({ query: availablePatientsQuerySchema }),
  asyncHandler(async (req, res) => {
    // TODO: REMOVE MOCK - Use req.user.id when requireAuth is enabled
    const userId = env.TEST_USER_ID // Mock user for testing (remove in production)

    // Zod validation ensures affiliateId is a string
    const { affiliateId } = req.query as { affiliateId: string }

    const patients = await getAvailablePatients(userId, affiliateId)

    res.status(200).json(patients)
  })
)

/**
 * POST /api/claims
 * Create a new claim
 */
router.post(
  '/claims',
  // TODO: UNCOMMENT BEFORE PRODUCTION!
  // requireAuth,
  validateRequest({ body: createClaimSchema }),
  asyncHandler(async (req, res) => {
    // TODO: REMOVE MOCK - Use req.user.id when requireAuth is enabled
    const userId = env.TEST_USER_ID // Mock user for testing (remove in production)

    const claim = await createClaim(userId, req.body)

    res.status(201).json(claim)
  })
)

export default router
