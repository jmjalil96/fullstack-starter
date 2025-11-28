/**
 * Ticket lifecycle configuration
 * Single source of truth for status and priority display
 */

import type { BadgeColor } from '../../shared/components/ui/data-display/StatusBadge'

import type { TicketPriority, TicketStatus } from './tickets'

/**
 * Status configuration with label and color
 */
export interface StatusConfig {
  label: string
  color: BadgeColor
}

/**
 * Ticket status configuration
 * Used for badges, filters, and display
 */
export const TICKET_STATUS_CONFIG: Record<TicketStatus, StatusConfig> = {
  OPEN: { label: 'Abierto', color: 'blue' },
  IN_PROGRESS: { label: 'En Progreso', color: 'yellow' },
  WAITING_ON_CLIENT: { label: 'Esperando Cliente', color: 'purple' },
  RESOLVED: { label: 'Resuelto', color: 'green' },
  CLOSED: { label: 'Cerrado', color: 'gray' },
}

/**
 * Ticket priority configuration
 * Used for badges, filters, and display
 */
export const TICKET_PRIORITY_CONFIG: Record<TicketPriority, StatusConfig> = {
  LOW: { label: 'Baja', color: 'gray' },
  NORMAL: { label: 'Normal', color: 'blue' },
  HIGH: { label: 'Alta', color: 'orange' },
  URGENT: { label: 'Urgente', color: 'red' },
}

/**
 * Type guard to validate TicketStatus at runtime
 * Protects against invalid URL parameters
 */
export function isValidTicketStatus(value: string): value is TicketStatus {
  const validStatuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'RESOLVED', 'CLOSED']
  return validStatuses.includes(value as TicketStatus)
}

/**
 * Type guard to validate TicketPriority at runtime
 * Protects against invalid URL parameters
 */
export function isValidTicketPriority(value: string): value is TicketPriority {
  const validPriorities: TicketPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT']
  return validPriorities.includes(value as TicketPriority)
}
