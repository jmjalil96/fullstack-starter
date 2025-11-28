/**
 * createTicket.service.ts
 * Service for creating new support tickets with full validation and security
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { ALL_AUTHORIZED_ROLES, BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'
import { generateTicketNumber } from '../shared/ticketNumber.utils.js'

import type { CreateTicketRequest, CreateTicketResponse } from './createTicket.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserContext {
  id: string
  name: string | null
  globalRole: { name: string } | null
  affiliate: { id: string; clientId: string } | null
  clientAccess: { clientId: string }[]
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Create a new support ticket with initial message
 *
 * @param userId - ID of user creating the ticket
 * @param data - Ticket data from request
 * @returns Created ticket with relations and initial message
 */
export async function createTicket(
  userId: string,
  data: CreateTicketRequest
): Promise<CreateTicketResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !ALL_AUTHORIZED_ROLES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized ticket creation attempt')
    throw new ForbiddenError('No tienes permiso para crear tickets')
  }

  const isBrokerEmployee = BROKER_EMPLOYEES.includes(roleName as never)
  const isClientAdmin = roleName === 'CLIENT_ADMIN'
  const isAffiliate = roleName === 'AFFILIATE'

  // STEP 3: Client Access Validation
  if (isAffiliate) {
    if (data.clientId !== user.affiliate?.clientId) {
      logger.warn(
        { userId, requestedClient: data.clientId, userClient: user.affiliate?.clientId },
        'AFFILIATE cross-client ticket creation attempt'
      )
      throw new ForbiddenError('No puedes crear tickets para otro cliente')
    }
  } else if (isClientAdmin) {
    const hasClientAccess = user.clientAccess.some((uc) => uc.clientId === data.clientId)
    if (!hasClientAccess) {
      logger.warn(
        { userId, requestedClient: data.clientId, accessibleClients: user.clientAccess.map((c) => c.clientId) },
        'CLIENT_ADMIN unauthorized client ticket creation attempt'
      )
      throw new ForbiddenError('No tienes acceso a este cliente')
    }
  }
  // Broker employees can create for any client

  // STEP 4: Validate Client Exists and is Active
  const client = await db.client.findUnique({
    where: { id: data.clientId },
    select: { id: true, name: true, isActive: true },
  })

  if (!client) {
    throw new NotFoundError('Cliente no encontrado')
  }

  if (!client.isActive) {
    throw new BadRequestError('Cliente inactivo')
  }

  // STEP 5: Validate Reporter (if provided)
  let reporter: { id: string; name: string | null } | null = null

  if (data.reporterId) {
    // Only broker employees can set reporterId for someone else
    if (!isBrokerEmployee && data.reporterId !== userId) {
      logger.warn(
        { userId, requestedReporter: data.reporterId },
        'Non-broker attempted to set different reporterId'
      )
      throw new ForbiddenError('Solo empleados del broker pueden reportar en nombre de otro usuario')
    }

    // Validate reporter exists and has access to this client
    const reporterUser = await db.user.findUnique({
      where: { id: data.reporterId },
      select: {
        id: true,
        name: true,
        affiliate: { select: { clientId: true } },
        clientAccess: { where: { isActive: true }, select: { clientId: true } },
      },
    })

    if (!reporterUser) {
      throw new NotFoundError('Usuario reportador no encontrado')
    }

    // Validate reporter has access to this client
    const reporterClientIds = [
      reporterUser.affiliate?.clientId,
      ...reporterUser.clientAccess.map((ca) => ca.clientId),
    ].filter(Boolean)

    if (!reporterClientIds.includes(data.clientId)) {
      throw new BadRequestError('El usuario reportador no tiene acceso a este cliente')
    }

    reporter = { id: reporterUser.id, name: reporterUser.name }
  } else if (!isBrokerEmployee) {
    // For clients/affiliates, reporterId defaults to themselves
    reporter = { id: userId, name: user.name }
  }

  // STEP 6: Validate Related Claim (if provided)
  let relatedClaim: { id: string; claimNumber: string } | null = null

  if (data.relatedClaimId) {
    const claim = await db.claim.findUnique({
      where: { id: data.relatedClaimId },
      select: { id: true, claimNumber: true, clientId: true },
    })

    if (!claim) {
      throw new NotFoundError('Reclamo relacionado no encontrado')
    }

    if (claim.clientId !== data.clientId) {
      logger.warn(
        { userId, claimId: data.relatedClaimId, claimClient: claim.clientId, ticketClient: data.clientId },
        'Claim-client mismatch in ticket creation'
      )
      throw new BadRequestError('El reclamo no pertenece al cliente especificado')
    }

    relatedClaim = { id: claim.id, claimNumber: claim.claimNumber }
  }

  // STEP 7: Validate Assignee (if provided)
  let assignee: { id: string; name: string | null } | null = null

  if (data.assignedToId) {
    // Only broker employees can assign tickets
    if (!isBrokerEmployee) {
      logger.warn({ userId, role: roleName }, 'Non-broker attempted to assign ticket')
      throw new ForbiddenError('Solo empleados del broker pueden asignar tickets')
    }

    const assignedUser = await db.user.findUnique({
      where: { id: data.assignedToId },
      select: {
        id: true,
        name: true,
        globalRole: { select: { name: true } },
      },
    })

    if (!assignedUser) {
      throw new NotFoundError('Usuario asignado no encontrado')
    }

    // Validate assignee is a broker employee
    const assigneeRole = assignedUser.globalRole?.name
    if (!assigneeRole || !BROKER_EMPLOYEES.includes(assigneeRole as never)) {
      throw new BadRequestError('Solo se puede asignar a empleados del broker')
    }

    assignee = { id: assignedUser.id, name: assignedUser.name }
  }

  // STEP 8: Create Ticket + Initial Message in Transaction
  const result = await db.$transaction(async (tx) => {
    // Get next sequence value
    const seqResult = await tx.$queryRaw<[{ nextval: bigint }]>`
      SELECT nextval(pg_get_serial_sequence('"Ticket"', 'ticketSequence'))
    `
    const ticketSequence = Number(seqResult[0].nextval)

    // Generate ticket number
    const ticketNumber = generateTicketNumber(ticketSequence)

    // Create ticket
    const ticket = await tx.ticket.create({
      data: {
        ticketSequence,
        ticketNumber,
        subject: data.subject,
        status: 'OPEN',
        priority: data.priority ?? 'NORMAL',
        category: data.category ?? null,
        clientId: data.clientId,
        reporterId: reporter?.id ?? null,
        relatedClaimId: relatedClaim?.id ?? null,
        createdById: userId,
        assignedToId: assignee?.id ?? null,
      },
      include: {
        client: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    })

    // Create initial message
    const message = await tx.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        message: data.message,
        authorId: userId,
      },
      include: {
        author: { select: { name: true } },
      },
    })

    return { ticket, message }
  })

  // Log successful creation
  logger.info(
    {
      ticketId: result.ticket.id,
      ticketNumber: result.ticket.ticketNumber,
      userId,
      clientId: data.clientId,
      reporterId: reporter?.id,
      assignedToId: assignee?.id,
    },
    'Ticket created successfully'
  )

  // STEP 9: Transform to Response DTO
  const response: CreateTicketResponse = {
    id: result.ticket.id,
    ticketNumber: result.ticket.ticketNumber,
    subject: result.ticket.subject,
    status: result.ticket.status,
    priority: result.ticket.priority,
    category: result.ticket.category,

    clientId: result.ticket.clientId,
    clientName: result.ticket.client.name,

    reporterId: reporter?.id ?? null,
    reporterName: reporter?.name ?? null,

    relatedClaimId: relatedClaim?.id ?? null,
    relatedClaimNumber: relatedClaim?.claimNumber ?? null,

    createdById: result.ticket.createdById,
    createdByName: result.ticket.createdBy.name ?? 'Unknown',

    assignedToId: assignee?.id ?? null,
    assignedToName: assignee?.name ?? null,

    createdAt: result.ticket.createdAt.toISOString(),
    updatedAt: result.ticket.updatedAt.toISOString(),

    messages: [
      {
        id: result.message.id,
        message: result.message.message,
        authorId: result.message.authorId,
        authorName: result.message.author.name ?? 'Unknown',
        createdAt: result.message.createdAt.toISOString(),
      },
    ],
  }

  return response
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with all context needed for ticket authorization
 *
 * @param userId - User ID to load
 * @returns User with role, affiliate, and client access data
 */
async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      globalRole: {
        select: { name: true },
      },
      affiliate: {
        select: { id: true, clientId: true },
      },
      clientAccess: {
        where: { isActive: true },
        select: { clientId: true },
      },
    },
  })
}
