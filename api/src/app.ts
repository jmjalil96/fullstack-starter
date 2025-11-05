import { toNodeHandler } from 'better-auth/node'
import cors from 'cors'
import express, { Request, Response } from 'express'
import { z } from 'zod'

import { auth } from './config/auth.js'
import { env } from './config/env.js'
import newClaimRouter from './features/claims/new/newClaim.route.js'
import { errorHandler } from './shared/errors/errorHandler.js'
import { NotFoundError, UnauthorizedError } from './shared/errors/errors.js'
import { asyncHandler } from './shared/middleware/asyncHandler.js'
import { requestLogger } from './shared/middleware/requestLogger.js'
import { requireAuth } from './shared/middleware/requireAuth.js'
import { applySecurityMiddleware } from './shared/middleware/security.js'
import { validateRequest } from './shared/middleware/validation.js'

// Feature routes

const app = express()

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
