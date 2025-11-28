/**
 * confirmUpload.service.ts
 * Service for confirming file uploads and creating File records
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { ClaimFileCategory, FileEntityType, InvoiceFileCategory } from '@prisma/client'

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { ConfirmUploadResponse } from './confirmUpload.dto.js'
import type { ConfirmUploadInput } from './confirmUpload.schema.js'

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
 * Confirm a file upload and create the File record in DB
 *
 * Authorization:
 * - BROKER_EMPLOYEES: Can upload to any entity
 * - CLIENT_ADMIN: Can upload to own client entities
 * - AFFILIATE: Can upload to own claims/tickets only
 *
 * @param userId - ID of the requesting user
 * @param data - Confirm upload data
 * @returns Created file record
 */
export async function confirmUpload(
  userId: string,
  data: ConfirmUploadInput
): Promise<ConfirmUploadResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Validate entity exists and user has access
  const { clientId } = await validateEntityAccess(user, data.entityType, data.entityId)

  // STEP 3: Check if file with this storage key already exists
  const existingFile = await db.file.findUnique({
    where: { storageKey: data.storageKey },
    select: { id: true },
  })

  if (existingFile) {
    throw new BadRequestError('Este archivo ya fue confirmado')
  }

  // STEP 4: Create File record and entity link in transaction
  const file = await db.$transaction(async (tx) => {
    // Create the main File record
    const newFile = await tx.file.create({
      data: {
        storageKey: data.storageKey,
        storageBucket: 'default',
        originalName: data.originalName,
        fileSize: BigInt(data.fileSize),
        mimeType: data.mimeType,
        entityType: data.entityType as FileEntityType,
        entityId: data.entityId,
        clientId: clientId,
        uploadedById: userId,
      },
    })

    // Create entity-specific link record
    await createEntityLink(tx, newFile.id, data)

    return newFile
  })

  // STEP 5: Log activity
  logger.info(
    {
      userId,
      fileId: file.id,
      entityType: data.entityType,
      entityId: data.entityId,
      originalName: data.originalName,
      fileSize: data.fileSize,
    },
    'File upload confirmed'
  )

  // STEP 6: Return response
  return {
    id: file.id,
    storageKey: file.storageKey,
    originalName: file.originalName,
    fileSize: file.fileSize.toString(),
    mimeType: file.mimeType,
    entityType: file.entityType,
    entityId: file.entityId,
    uploadedAt: file.uploadedAt.toISOString(),
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
 * Returns the clientId for the entity
 */
async function validateEntityAccess(
  user: UserContext,
  entityType: string,
  entityId: string
): Promise<{ clientId: string | null }> {
  const roleName = user.globalRole?.name
  const isBrokerEmployee = roleName ? BROKER_EMPLOYEES.includes(roleName as never) : false
  const isClientAdmin = roleName === 'CLIENT_ADMIN'
  const isAffiliate = roleName === 'AFFILIATE'

  // BROKER_EMPLOYEES can access any entity
  if (isBrokerEmployee) {
    const clientId = await getEntityClientId(entityType, entityId)
    return { clientId }
  }

  // CLIENT_ADMIN: Can access own client entities
  if (isClientAdmin) {
    const clientId = await getEntityClientId(entityType, entityId)
    if (clientId) {
      const hasAccess = user.clientAccess.some((uc) => uc.clientId === clientId)
      if (!hasAccess) {
        throw new ForbiddenError('No tienes acceso a esta entidad')
      }
    }
    return { clientId }
  }

  // AFFILIATE: Can access own claims/tickets only
  if (isAffiliate) {
    if (entityType === 'CLAIM') {
      // Block ALL claim confirms via this endpoint
      // Affiliates must use pending upload during claim creation
      logger.warn({ userId: user.id, entityId }, 'Affiliate attempted claim confirm via standard endpoint')
      throw new ForbiddenError('Los afiliados deben subir archivos durante la creación del reclamo')
    }

    if (entityType === 'TICKET') {
      const ticket = await db.ticket.findUnique({
        where: { id: entityId },
        select: { createdById: true, clientId: true },
      })

      if (!ticket) {
        throw new NotFoundError('Ticket no encontrado')
      }

      if (ticket.createdById !== user.id) {
        throw new ForbiddenError('No tienes acceso a este ticket')
      }
      return { clientId: ticket.clientId }
    }

    // AFFILIATE cannot upload to INVOICE or DOCUMENT
    throw new ForbiddenError('No tienes permiso para subir archivos a este tipo de entidad')
  }

  // Unknown role
  throw new ForbiddenError('No tienes permiso para subir archivos')
}

/**
 * Get the clientId associated with an entity
 */
async function getEntityClientId(entityType: string, entityId: string): Promise<string | null> {
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
      return ticket.clientId
    }

    case 'DOCUMENT':
      // Documents don't have a pre-existing clientId
      return null

    default:
      throw new BadRequestError('Tipo de entidad inválido')
  }
}

/**
 * Create the entity-specific link record (ClaimFile, InvoiceFile, etc.)
 */
async function createEntityLink(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  fileId: string,
  data: ConfirmUploadInput
): Promise<void> {
  switch (data.entityType) {
    case 'CLAIM':
      await tx.claimFile.create({
        data: {
          fileId,
          claimId: data.entityId,
          category: data.category as ClaimFileCategory | undefined,
          description: data.description,
        },
      })
      break

    case 'INVOICE':
      await tx.invoiceFile.create({
        data: {
          fileId,
          invoiceId: data.entityId,
          category: data.category as InvoiceFileCategory | undefined,
          description: data.description,
        },
      })
      break

    case 'TICKET':
      // For tickets, we need a messageId - for now, throw error
      // This will be handled differently when attaching to messages
      throw new BadRequestError('Para subir archivos a tickets, use el endpoint de mensajes')

    case 'DOCUMENT':
      // Documents are library items - create Document record
      await tx.document.create({
        data: {
          fileId,
          title: data.originalName,
          description: data.description,
          category: data.category,
          isPublic: false,
          isActive: true,
        },
      })
      break

    default:
      throw new BadRequestError('Tipo de entidad inválido')
  }
}
