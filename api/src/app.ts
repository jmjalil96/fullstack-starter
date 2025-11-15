import { toNodeHandler } from 'better-auth/node'
import cors from 'cors'
import express, { Request, Response } from 'express'
import { z } from 'zod'

import { auth } from './config/auth.js'
import { env } from './config/env.js'
import affiliateEditRouter from './features/affiliates/edit/affiliateEdit.route.js'
import availableClientsForAffiliatesRouter from './features/affiliates/lookups/clients.route.js'
import availableOwnersRouter from './features/affiliates/lookups/owners.route.js'
import createAffiliateRouter from './features/affiliates/new/createAffiliate.route.js'
import viewAffiliatesRouter from './features/affiliates/views/viewAffiliates.route.js'
import claimEditRouter from './features/claims/edit/claimEdit.route.js'
import newClaimRouter from './features/claims/new/newClaim.route.js'
import availablePoliciesRouter from './features/claims/policies/availablePolicies.route.js'
import viewClaimsRouter from './features/claims/views/viewClaims.route.js'
import clientEditRouter from './features/clients/edit/clientEdit.route.js'
import createClientRouter from './features/clients/new/createClient.route.js'
import viewClientsRouter from './features/clients/views/viewClients.route.js'
import policyAffiliatesRouter from './features/policies/affiliates/policyAffiliates.route.js'
import policyEditRouter from './features/policies/edit/policyEdit.route.js'
import availableClientsRouter from './features/policies/lookups/clients.route.js'
import availableInsurersRouter from './features/policies/lookups/insurers.route.js'
import createPolicyRouter from './features/policies/new/createPolicy.route.js'
import viewPoliciesRouter from './features/policies/views/viewPolicies.route.js'
import { errorHandler } from './shared/errors/errorHandler.js'
import { NotFoundError, UnauthorizedError } from './shared/errors/errors.js'
import { asyncHandler } from './shared/middleware/asyncHandler.js'
import { requestLogger } from './shared/middleware/requestLogger.js'
import { requireAuth } from './shared/middleware/requireAuth.js'
import { applySecurityMiddleware } from './shared/middleware/security.js'
import { validateRequest } from './shared/middleware/validation.js'

// Feature routes

const app = express()

// Trust proxy - required for Railway/cloud platforms to get real client IP
app.set('trust proxy', true)

// 1. Request logging - first to log everything
app.use(requestLogger)

// 2. CORS - BEFORE BetterAuth to handle OPTIONS preflight
app.use(
  cors({
    origin: env.CORS_ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// 3. Auth routes (BEFORE body parsing - BetterAuth handles its own body parsing)
app.all('/api/auth/*', toNodeHandler(auth))

// 4. Security middleware - Helmet, Rate Limiting, Body Parsing (CORS already applied)
applySecurityMiddleware(app)

// 5. Feature Routes
app.use('/api', newClaimRouter)
app.use('/api', viewClaimsRouter)
app.use('/api', claimEditRouter)
app.use('/api', availablePoliciesRouter)
app.use('/api', availableClientsForAffiliatesRouter)
app.use('/api', availableOwnersRouter)
app.use('/api', createAffiliateRouter)
app.use('/api', affiliateEditRouter)
app.use('/api', viewAffiliatesRouter)
app.use('/api', createClientRouter)
app.use('/api', clientEditRouter)
app.use('/api', viewClientsRouter)
app.use('/api', availableClientsRouter)
app.use('/api', availableInsurersRouter)
app.use('/api', createPolicyRouter)
app.use('/api', policyAffiliatesRouter)
app.use('/api', policyEditRouter)
app.use('/api', viewPoliciesRouter)

// 6. Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// Demo: Request validation example
const demoUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(18).max(120).optional(),
})

app.post(
  '/demo/validate',
  validateRequest({ body: demoUserSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      message: 'Validation passed!',
      data: req.body,
    })
  })
)

// Demo: Protected route (requires authentication)
app.get(
  '/api/protected',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    // Explicit check for TypeScript (redundant but satisfies linter)
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }

    res.json({
      message: 'This is a protected route',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  })
)

// 4. 404 handler - must be after all other routes
app.use((_req: Request, _res: Response) => {
  throw new NotFoundError('Route not found')
})

// 5. Global error handler - must be LAST
app.use(errorHandler)

export { app }
