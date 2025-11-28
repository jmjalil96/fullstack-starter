/**
 * Ticket number generation using database sequence + hashids encoding
 */

import Hashids from 'hashids'

import { env } from '../../../config/env.js'

// Warn if using default salt in development
if (!env.TICKET_NUMBER_SALT && env.NODE_ENV === 'development') {
  console.warn(
    '⚠️  WARNING: Using default TICKET_NUMBER_SALT. ' +
    'Set TICKET_NUMBER_SALT in .env for production.'
  )
}

const HASHIDS_MIN_LENGTH = 8
const HASHIDS_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No 0/O, 1/I/L

const hashids = new Hashids(
  env.TICKET_NUMBER_SALT || 'capstone360-tickets-dev-fallback',
  HASHIDS_MIN_LENGTH,
  HASHIDS_ALPHABET
)

/**
 * Generate ticket number from database sequence ID
 *
 * @param sequenceId - Auto-increment ID from database
 * @returns Ticket number string (e.g., "TKT_A7K2M9P4")
 *
 * @example
 * const ticketNumber = generateTicketNumber(12345)
 * // Returns: "TKT_A7K2M9P4"
 */
export function generateTicketNumber(sequenceId: number): string {
  const encoded = hashids.encode(sequenceId)
  return `TKT_${encoded.toUpperCase()}`
}
