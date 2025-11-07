/**
 * Claim Lifecycle Rules (Frontend)
 *
 * ⚠️⚠️⚠️ CRITICAL: MANUAL COPY FROM BACKEND BLUEPRINT ⚠️⚠️⚠️
 *
 * SOURCE FILE: api/src/features/claims/shared/claimLifecycle.blueprint.ts
 *
 * IF YOU CHANGE LIFECYCLE RULES IN THE BACKEND, YOU MUST MANUALLY UPDATE THIS FILE!
 *
 * Fields to keep in sync:
 * - editableFields arrays (which fields can be edited per status)
 * - transitions arrays (valid status changes)
 * - requirements arrays (fields needed before transitioning)
 * - status labels
 *
 * Last synced: 2025-11-07
 * Synced by: Juan Jalil
 *
 * TODO: Consider auto-generating this file from backend blueprint at build time
 */

import type { ClaimStatus } from '../types/claims'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Button variant for transition actions
 * Must match Button component API
 */
export type TransitionVariant = 'primary' | 'success' | 'danger'

/**
 * Status transition configuration
 */
export interface Transition {
  /** Target status */
  status: ClaimStatus
  /** Short label for UI (e.g., "Aprobar") */
  label: string
  /** Full button label (e.g., "✓ Aprobar Reclamo") */
  buttonLabel: string
  /** Button variant/color */
  variant: TransitionVariant
  /** Icon/emoji for visual distinction */
  icon: string
}

// ============================================================================
// LIFECYCLE BLUEPRINT
// ============================================================================

/**
 * Claim lifecycle state machine rules
 *
 * Defines for each status:
 * - Which fields are editable
 * - Which fields are locked (shown but disabled)
 * - Valid status transitions
 * - Required fields before transitioning
 *
 * Flow: SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED (terminal)
 */
export const CLAIM_LIFECYCLE = {
  /**
   * SUBMITTED - Initial state when claim is created
   * Editable by: SENIOR_CLAIM_MANAGERS
   */
  SUBMITTED: {
    label: 'Enviado',
    color: 'blue',
    editableFields: ['description', 'amount', 'policyId', 'incidentDate', 'type', 'submittedDate'],
    lockedFields: ['approvedAmount', 'resolvedDate'],
    transitions: [
      {
        status: 'UNDER_REVIEW' as ClaimStatus,
        label: 'Mover a Revisión',
        buttonLabel: 'Mover a Revisión →',
        variant: 'primary' as TransitionVariant,
        icon: '→',
      },
    ],
    requirements: ['description', 'amount', 'policyId', 'incidentDate', 'type', 'submittedDate'],
  },

  /**
   * UNDER_REVIEW - Claim is being actively reviewed
   * Editable by: SENIOR_CLAIM_MANAGERS
   */
  UNDER_REVIEW: {
    label: 'En Revisión',
    color: 'yellow',
    editableFields: ['approvedAmount', 'resolvedDate'],
    lockedFields: ['description', 'amount', 'policyId', 'incidentDate', 'type', 'submittedDate'],
    transitions: [
      {
        status: 'APPROVED' as ClaimStatus,
        label: 'Aprobar',
        buttonLabel: '✓ Aprobar Reclamo',
        variant: 'success' as TransitionVariant,
        icon: '✓',
      },
      {
        status: 'REJECTED' as ClaimStatus,
        label: 'Rechazar',
        buttonLabel: '✗ Rechazar Reclamo',
        variant: 'danger' as TransitionVariant,
        icon: '✗',
      },
    ],
    requirements: [
      'description',
      'amount',
      'policyId',
      'incidentDate',
      'type',
      'submittedDate',
      'approvedAmount',
      'resolvedDate',
    ],
  },

  /**
   * APPROVED - Terminal state (claim was approved)
   * Editable by: SUPER_ADMIN only (no fields currently editable)
   */
  APPROVED: {
    label: 'Aprobado',
    color: 'green',
    editableFields: [],
    lockedFields: ['*'], // All fields locked
    transitions: [],
    requirements: [],
  },

  /**
   * REJECTED - Terminal state (claim was rejected)
   * Editable by: SUPER_ADMIN only (no fields currently editable)
   */
  REJECTED: {
    label: 'Rechazado',
    color: 'red',
    editableFields: [],
    lockedFields: ['*'], // All fields locked
    transitions: [],
    requirements: [],
  },
} as const

// ============================================================================
// FIELD LABELS
// ============================================================================

/**
 * Spanish labels for claim fields
 * Used for display in forms, error messages, and diff views
 */
export const FIELD_LABELS = {
  description: 'Descripción',
  amount: 'Monto Reclamado',
  approvedAmount: 'Monto Aprobado',
  policyId: 'Póliza',
  incidentDate: 'Fecha del Incidente',
  submittedDate: 'Fecha de Envío',
  resolvedDate: 'Fecha de Resolución',
  type: 'Tipo de Reclamo',
} as const

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Valid lifecycle state keys
 */
export type ClaimLifecycleState = keyof typeof CLAIM_LIFECYCLE

/**
 * Valid claim field keys
 */
export type ClaimField = keyof typeof FIELD_LABELS

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a field value is present (not missing)
 *
 * Treats these as PRESENT:
 * - 0, false, "" (valid values)
 *
 * Treats these as MISSING:
 * - null, undefined
 *
 * @param value - Field value to check
 * @returns true if value is present, false if missing
 */
export function isFieldPresent(value: unknown): boolean {
  return value !== null && value !== undefined
}
