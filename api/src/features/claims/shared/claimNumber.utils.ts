/**
 * Claim number generation using database sequence + hashids encoding
 */

import Hashids from 'hashids'

import { env } from '../../../config/env.js'

// Warn if using default salt in development
if (!env.CLAIM_NUMBER_SALT && env.NODE_ENV === 'development') {
  console.warn(
    '⚠️  WARNING: Using default CLAIM_NUMBER_SALT. ' +
    'Set CLAIM_NUMBER_SALT in .env for production.'
  )
}

const HASHIDS_MIN_LENGTH = 8
const HASHIDS_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No 0/O, 1/I/L

const hashids = new Hashids(
  env.CLAIM_NUMBER_SALT || 'capstone360-claims-dev-fallback',
  HASHIDS_MIN_LENGTH,
  HASHIDS_ALPHABET
)

/**
 * Generate claim number from database sequence ID
 *
 * @param sequenceId - Auto-increment ID from database
 * @returns Claim number string (e.g., "RECL_A7K2M9P4")
 *
 * @example
 * const claimNumber = generateClaimNumber(12345)
 * // Returns: "RECL_A7K2M9P4"
 */
export function generateClaimNumber(sequenceId: number): string {
  const encoded = hashids.encode(sequenceId)
  return `RECL_${encoded.toUpperCase()}`
}
