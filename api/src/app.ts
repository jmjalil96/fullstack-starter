import { toNodeHandler } from 'better-auth/node'
import cors from 'cors'
import express, { Request, Response } from 'express'
import { z } from 'zod'

import { auth } from './config/auth.js'
import { env } from './config/env.js'
import affiliateEditRouter from './features/affiliates/edit/affiliateEdit.route.js'
import availableClientsForAffiliatesRouter from './features/affiliates/lookups/clients.route.js'
import availableOwnersRouter from './features/affiliates/lookups/owners.route.js'
import invitableAffiliatesRouter from './features/affiliates/views/invitableAffiliates.route.js'
import viewAffiliatesRouter from './features/affiliates/views/viewAffiliates.route.js'
import editAgentRouter from './features/agents/edit/editAgent.route.js'
import viewAgentsRouter from './features/agents/views/viewAgents.route.js'
import improveTextRouter from './features/ai/improve/improveText.route.js'
import claimEditRouter from './features/claims/edit/claimEdit.route.js'
import claimFilesRouter from './features/claims/files/claimFiles.route.js'
import addClaimInvoiceRouter from './features/claims/invoices/addClaimInvoice.route.js'
import removeClaimInvoiceRouter from './features/claims/invoices/removeClaimInvoice.route.js'
import availableAffiliatesForClaimsRouter from './features/claims/lookups/affiliates.route.js'
import availableClientsForClaimsRouter from './features/claims/lookups/clients.route.js'
import availablePatientsForClaimsRouter from './features/claims/lookups/patients.route.js'
import newClaimRouter from './features/claims/new/newClaim.route.js'
import availablePoliciesRouter from './features/claims/policies/availablePolicies.route.js'
import viewClaimsRouter from './features/claims/views/viewClaims.route.js'
import clientEditRouter from './features/clients/edit/clientEdit.route.js'
import createClientRouter from './features/clients/new/createClient.route.js'
import viewClientsRouter from './features/clients/views/viewClients.route.js'
import editEmployeeRouter from './features/employees/edit/editEmployee.route.js'
import viewEmployeesRouter from './features/employees/views/viewEmployees.route.js'
import confirmUploadRouter from './features/files/core/confirmUpload.route.js'
import deleteFileRouter from './features/files/core/deleteFile.route.js'
import downloadUrlRouter from './features/files/core/downloadUrl.route.js'
import uploadUrlRouter from './features/files/core/uploadUrl.route.js'
import pendingUploadRouter from './features/files/pending/pendingUpload.route.js'
import insurerEditRouter from './features/insurers/edit/insurerEdit.route.js'
import createInsurerRouter from './features/insurers/new/createInsurer.route.js'
import viewInsurersRouter from './features/insurers/views/viewInsurers.route.js'
import acceptInvitationRouter from './features/invitations/accept/acceptInvitation.route.js'
import manageInvitationRouter from './features/invitations/manage/manageInvitation.route.js'
import inviteAffiliateRouter from './features/invitations/new/inviteAffiliate.route.js'
import inviteAgentRouter from './features/invitations/new/inviteAgent.route.js'
import inviteEmployeeRouter from './features/invitations/new/inviteEmployee.route.js'
import validateInvitationRouter from './features/invitations/validate/validateInvitation.route.js'
import viewInvitationsRouter from './features/invitations/views/viewInvitations.route.js'
import invoiceEditRouter from './features/invoices/edit/invoiceEdit.route.js'
import availableClientsForInvoicesRouter from './features/invoices/lookups/clients.route.js'
import availablePoliciesForInvoicesRouter from './features/invoices/lookups/policies.route.js'
import createInvoiceRouter from './features/invoices/new/createInvoice.route.js'
import validateInvoiceRouter from './features/invoices/validate/validateInvoice.route.js'
import viewInvoicesRouter from './features/invoices/views/viewInvoices.route.js'
import policyAffiliatesRouter from './features/policies/affiliates/policyAffiliates.route.js'
import policyEditRouter from './features/policies/edit/policyEdit.route.js'
import availableClientsRouter from './features/policies/lookups/clients.route.js'
import availableInsurersRouter from './features/policies/lookups/insurers.route.js'
import createPolicyRouter from './features/policies/new/createPolicy.route.js'
import viewPoliciesRouter from './features/policies/views/viewPolicies.route.js'
import viewRolesRouter from './features/roles/views/viewRoles.route.js'
import assignTicketRouter from './features/tickets/edit/assignTicket.route.js'
import ticketEditRouter from './features/tickets/edit/ticketEdit.route.js'
import availableClientsForTicketsRouter from './features/tickets/lookups/clients.route.js'
import addTicketMessageRouter from './features/tickets/messages/addMessage.route.js'
import createTicketRouter from './features/tickets/new/createTicket.route.js'
import viewTicketsRouter from './features/tickets/views/viewTickets.route.js'
import editUserRouter from './features/users/edit/editUser.route.js'
import viewUsersRouter from './features/users/views/viewUsers.route.js'
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
app.use('/api', availableClientsForClaimsRouter)
app.use('/api', availableAffiliatesForClaimsRouter)
app.use('/api', availablePatientsForClaimsRouter)
app.use('/api', newClaimRouter)
app.use('/api', viewClaimsRouter)
app.use('/api', claimEditRouter)
app.use('/api', claimFilesRouter)
app.use('/api', addClaimInvoiceRouter)
app.use('/api', removeClaimInvoiceRouter)
app.use('/api', availablePoliciesRouter)
app.use('/api', availableClientsForAffiliatesRouter)
app.use('/api', availableOwnersRouter)
app.use('/api', affiliateEditRouter)
app.use('/api', invitableAffiliatesRouter)
app.use('/api', viewAffiliatesRouter)
app.use('/api', editAgentRouter)
app.use('/api', viewAgentsRouter)
app.use('/api', improveTextRouter)
app.use('/api', createClientRouter)
app.use('/api', clientEditRouter)
app.use('/api', viewClientsRouter)
app.use('/api', editEmployeeRouter)
app.use('/api', viewEmployeesRouter)
app.use('/api', availableClientsForInvoicesRouter)
app.use('/api', availablePoliciesForInvoicesRouter)
app.use('/api', createInvoiceRouter)
app.use('/api', invoiceEditRouter)
app.use('/api', validateInvoiceRouter)
app.use('/api', viewInvoicesRouter)
app.use('/api', createInsurerRouter)
app.use('/api', insurerEditRouter)
app.use('/api', viewInsurersRouter)
app.use('/api', acceptInvitationRouter)
app.use('/api', manageInvitationRouter)
app.use('/api', inviteAffiliateRouter)
app.use('/api', inviteAgentRouter)
app.use('/api', inviteEmployeeRouter)
app.use('/api', validateInvitationRouter)
app.use('/api', viewInvitationsRouter)
app.use('/api', availableClientsRouter)
app.use('/api', availableInsurersRouter)
app.use('/api', createPolicyRouter)
app.use('/api', policyAffiliatesRouter)
app.use('/api', policyEditRouter)
app.use('/api', viewPoliciesRouter)
app.use('/api', viewRolesRouter)
app.use('/api', availableClientsForTicketsRouter)
app.use('/api', createTicketRouter)
app.use('/api', assignTicketRouter)
app.use('/api', ticketEditRouter)
app.use('/api', addTicketMessageRouter)
app.use('/api', viewTicketsRouter)
app.use('/api', editUserRouter)
app.use('/api', viewUsersRouter)
app.use('/api', uploadUrlRouter)
app.use('/api', pendingUploadRouter)
app.use('/api', confirmUploadRouter)
app.use('/api', downloadUrlRouter)
app.use('/api', deleteFileRouter)

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
