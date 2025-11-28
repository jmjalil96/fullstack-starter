/**
 * uploadUrl.service.ts
 * Service for generating presigned upload URLs
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import {
  generateStorageKey,
  getUploadUrl,
  isMimeTypeAllowed,
  isStorageConfigured,
} from '../../../lib/storage.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { UploadUrlResponse } from './uploadUrl.dto.js'
import type { UploadUrlInput } from './uploadUrl.schema.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserContext {
  id: string
  globalRole: { name: string } | null
  affiliate: { id: string; clientId: string } | null
  clientAccess: { clientId: string }[]
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Generate a presigned upload URL for direct R2 upload
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can upload to any entity
 * - CLIENT_ADMIN: Can upload to own client entities
 * - AFFILIATE: Can upload to own claims/tickets only
 *
 * @param userId - ID of the requesting user
 * @param data - Upload URL request data
 * @returns Presigned upload URL and storage key
 */
export async function requestUploadUrl(
  userId: string,
  data: UploadUrlInput
): Promise<UploadUrlResponse> {
  // STEP 1: Check storage is configured
  if (!isStorageConfigured()) {
    throw new BadRequestError('El almacenamiento de archivos no está configurado')
  }

  // STEP 2: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 3: Validate MIME type
  if (!isMimeTypeAllowed(data.mimeType)) {
    throw new BadRequestError(`Tipo de archivo no permitido: ${data.mimeType}`)
  }

  // STEP 4: Validate entity exists and user has access
  await validateEntityAccess(user, data.entityType, data.entityId)

  // STEP 5: Generate storage key
  const storageKey = generateStorageKey(
    data.entityType.toLowerCase(),
    data.entityId,
    data.fileName
  )

  // STEP 6: Get presigned upload URL
  const { url, expiresIn } = await getUploadUrl(storageKey, data.mimeType, data.fileSize)

  // STEP 7: Log activity
  logger.info(
    {
      userId,
      entityType: data.entityType,
      entityId: data.entityId,
      fileName: data.fileName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
    },
    'Upload URL generated'
  )

  // STEP 8: Return response
  return {
    uploadUrl: url,
    storageKey,
    expiresIn,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with all context needed for authorization
 */
async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      globalRole: { select: { name: true } },
      affiliate: { select: { id: true, clientId: true } },
      clientAccess: {
        where: { isActive: true },
        select: { clientId: true },
      },
    },
  })
}

/**
 * Validate that user has access to upload to the specified entity
 */
async function validateEntityAccess(
  user: UserContext,
  entityType: string,
  entityId: string
): Promise<void> {
  const roleName = user.globalRole?.name
  const isBrokerEmployee = roleName ? BROKER_EMPLOYEES.includes(roleName as never) : false
  const isClientAdmin = roleName === 'CLIENT_ADMIN'
  const isAffiliate = roleName === 'AFFILIATE'

  // BROKER_EMPLOYEES can access any entity
  if (isBrokerEmployee) {
    await validateEntityExists(entityType, entityId)
    return
  }

  // CLIENT_ADMIN: Can access own client entities
  if (isClientAdmin) {
    const clientId = await getEntityClientId(entityType, entityId)
    const hasAccess = user.clientAccess.some((uc) => uc.clientId === clientId)

    if (!hasAccess) {
      throw new ForbiddenError('No tienes acceso a esta entidad')
    }
    return
  }

  // AFFILIATE: Different rules per entity type
  if (isAffiliate) {
    if (entityType === 'CLAIM') {
      // Block ALL claim uploads via this endpoint
      // Affiliates must use pending upload during claim creation
      logger.warn({ userId: user.id, entityId }, 'Affiliate attempted claim upload via standard endpoint')
      throw new ForbiddenError('Los afiliados deben subir archivos durante la creación del reclamo')
    }

    if (entityType === 'TICKET') {
      // Allow - affiliates can upload to their own tickets (replies)
      const ticket = await db.ticket.findUnique({
        where: { id: entityId },
        select: { createdById: true },
      })

      if (!ticket) {
        throw new NotFoundError('Ticket no encontrado')
      }

      if (ticket.createdById !== user.id) {
        throw new ForbiddenError('No tienes acceso a este ticket')
      }
      return
    }

    // AFFILIATE cannot upload to INVOICE or DOCUMENT
    throw new ForbiddenError('No tienes permiso para subir archivos a este tipo de entidad')
  }

  // Unknown role
  throw new ForbiddenError('No tienes permiso para subir archivos')
}

/**
 * Validate that an entity exists
 */
async function validateEntityExists(entityType: string, entityId: string): Promise<void> {
  let exists = false

  switch (entityType) {
    case 'CLAIM':
      exists = !!(await db.claim.findUnique({ where: { id: entityId }, select: { id: true } }))
      if (!exists) throw new NotFoundError('Reclamo no encontrado')
      break

    case 'INVOICE':
      exists = !!(await db.invoice.findUnique({ where: { id: entityId }, select: { id: true } }))
      if (!exists) throw new NotFoundError('Factura no encontrada')
      break

    case 'TICKET':
      exists = !!(await db.ticket.findUnique({ where: { id: entityId }, select: { id: true } }))
      if (!exists) throw new NotFoundError('Ticket no encontrado')
      break

    case 'DOCUMENT':
      // Documents are created during confirm, not pre-existing
      // For DOCUMENT type, we don't validate existence here
      break

    default:
      throw new BadRequestError('Tipo de entidad inválido')
  }
}

/**
 * Get the clientId associated with an entity
 */
async function getEntityClientId(entityType: string, entityId: string): Promise<string> {
  switch (entityType) {
    case 'CLAIM': {
      const claim = await db.claim.findUnique({
        where: { id: entityId },
        select: { affiliate: { select: { clientId: true } } },
      })
      if (!claim) throw new NotFoundError('Reclamo no encontrado')
      return claim.affiliate.clientId
    }

    case 'INVOICE': {
      const invoice = await db.invoice.findUnique({
        where: { id: entityId },
        select: { clientId: true },
      })
      if (!invoice) throw new NotFoundError('Factura no encontrada')
      return invoice.clientId
    }

    case 'TICKET': {
      const ticket = await db.ticket.findUnique({
        where: { id: entityId },
        select: { clientId: true },
      })
      if (!ticket) throw new NotFoundError('Ticket no encontrado')
      if (!ticket.clientId) throw new ForbiddenError('Este ticket no está asociado a un cliente')
      return ticket.clientId
    }

    case 'DOCUMENT':
      // Documents don't have a pre-existing clientId
      throw new ForbiddenError('Los documentos de biblioteca son solo para empleados')

    default:
      throw new BadRequestError('Tipo de entidad inválido')
  }
}
