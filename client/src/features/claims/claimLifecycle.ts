/**
 * Claim Lifecycle Rules (Frontend)
 *
 * SOURCE FILE: api/src/features/claims/shared/claimLifecycle.blueprint.ts
 *
 * 7-Status Workflow:
 * DRAFT → VALIDATION → SUBMITTED → SETTLED (normal flow)
 *                   ↘ RETURNED (if documents incomplete)
 *         SUBMITTED → PENDING_INFO → SUBMITTED (reprocess loop)
 * Any state → CANCELLED
 *
 * Terminal states: RETURNED, SETTLED, CANCELLED
 */

import type { ClaimStatus } from './claims'

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
  /** Short label for UI (e.g., "Tramitar") */
  label: string
  /** Full button label (e.g., "Tramitar →") */
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
 * Flow: DRAFT → VALIDATION → SUBMITTED → SETTLED
 * with PENDING_INFO as reprocess loop from SUBMITTED
 * RETURNED, CANCELLED as terminal alternatives
 */
export const CLAIM_LIFECYCLE = {
  /**
   * DRAFT - Initial state when claim is created
   * Editable by: SENIOR_CLAIM_MANAGERS
   */
  DRAFT: {
    label: 'Borrador',
    color: 'gray',
    editableFields: [
      'careType',
      'diagnosisCode',
      'diagnosisDescription',
      'amountSubmitted',
      'incidentDate',
      'submittedDate',
      'description',
      'policyId',
    ],
    lockedFields: [],
    transitions: [
      {
        status: 'VALIDATION' as ClaimStatus,
        label: 'Validar',
        buttonLabel: 'Validar →',
        variant: 'primary' as TransitionVariant,
        icon: '→',
      },
      {
        status: 'CANCELLED' as ClaimStatus,
        label: 'Cancelar',
        buttonLabel: 'Cancelar',
        variant: 'danger' as TransitionVariant,
        icon: '✗',
      },
    ],
    transitionRequirements: {
      VALIDATION: ['careType', 'incidentDate', 'submittedDate', 'amountSubmitted', 'diagnosisDescription'],
      CANCELLED: [],
    },
  },

  /**
   * VALIDATION - Internal review before sending to insurer
   * Editable by: SENIOR_CLAIM_MANAGERS
   */
  VALIDATION: {
    label: 'Validación',
    color: 'yellow',
    editableFields: [
      'careType',
      'diagnosisCode',
      'diagnosisDescription',
      'amountSubmitted',
      'incidentDate',
      'submittedDate',
      'description',
      'policyId',
    ],
    lockedFields: [],
    transitions: [
      {
        status: 'SUBMITTED' as ClaimStatus,
        label: 'Tramitar',
        buttonLabel: 'Tramitar →',
        variant: 'primary' as TransitionVariant,
        icon: '→',
      },
      {
        status: 'RETURNED' as ClaimStatus,
        label: 'Devolver',
        buttonLabel: 'Devolver',
        variant: 'danger' as TransitionVariant,
        icon: '↩',
      },
      {
        status: 'CANCELLED' as ClaimStatus,
        label: 'Cancelar',
        buttonLabel: 'Cancelar',
        variant: 'danger' as TransitionVariant,
        icon: '✗',
      },
    ],
    transitionRequirements: {
      SUBMITTED: [],
      RETURNED: [],
      CANCELLED: [],
    },
  },

  /**
   * SUBMITTED - Sent to insurer (Tramitado)
   * Editable by: SENIOR_CLAIM_MANAGERS
   * Only businessDays editable while waiting for insurer response
   */
  SUBMITTED: {
    label: 'Tramitado',
    color: 'blue',
    editableFields: [
      'businessDays',
      'amountApproved',
      'amountDenied',
      'amountUnprocessed',
      'deductibleApplied',
      'copayApplied',
      'settlementDate',
      'settlementNumber',
      'settlementNotes',
    ],
    lockedFields: ['*'],
    transitions: [
      {
        status: 'PENDING_INFO' as ClaimStatus,
        label: 'Solicitar Info',
        buttonLabel: 'Solicitar Info',
        variant: 'primary' as TransitionVariant,
        icon: '?',
      },
      {
        status: 'SETTLED' as ClaimStatus,
        label: 'Liquidar',
        buttonLabel: '✓ Liquidar',
        variant: 'success' as TransitionVariant,
        icon: '✓',
      },
      {
        status: 'CANCELLED' as ClaimStatus,
        label: 'Cancelar',
        buttonLabel: 'Cancelar',
        variant: 'danger' as TransitionVariant,
        icon: '✗',
      },
    ],
    transitionRequirements: {
      PENDING_INFO: [],
      SETTLED: [
        'amountApproved',
        'amountDenied',
        'amountUnprocessed',
        'deductibleApplied',
        'copayApplied',
        'settlementDate',
        'settlementNumber',
      ],
      CANCELLED: [],
    },
  },

  /**
   * PENDING_INFO - Insurer requested more information
   * Editable by: SENIOR_CLAIM_MANAGERS
   * Can edit data fields and then resubmit to insurer
   */
  PENDING_INFO: {
    label: 'Pendiente Info',
    color: 'orange',
    editableFields: [
      'careType',
      'diagnosisCode',
      'diagnosisDescription',
      'amountSubmitted',
      'incidentDate',
      'submittedDate',
      'description',
      'policyId',
      'businessDays',
    ],
    lockedFields: [],
    transitions: [
      {
        status: 'SUBMITTED' as ClaimStatus,
        label: 'Reenviar',
        buttonLabel: 'Reenviar →',
        variant: 'primary' as TransitionVariant,
        icon: '→',
      },
      {
        status: 'CANCELLED' as ClaimStatus,
        label: 'Cancelar',
        buttonLabel: 'Cancelar',
        variant: 'danger' as TransitionVariant,
        icon: '✗',
      },
    ],
    transitionRequirements: {
      SUBMITTED: [], // Reprocess fields collected in StatusTransitionModal
      CANCELLED: [],
    },
  },

  /**
   * RETURNED - Returned by insurer (Terminal)
   * Editable by: SUPER_ADMIN only (for future features)
   */
  RETURNED: {
    label: 'Devuelto',
    color: 'red',
    editableFields: [],
    lockedFields: ['*'],
    transitions: [],
    transitionRequirements: {},
  },

  /**
   * SETTLED - Settlement received (Terminal)
   * Editable by: SUPER_ADMIN only (for future features)
   */
  SETTLED: {
    label: 'Liquidado',
    color: 'green',
    editableFields: [],
    lockedFields: ['*'],
    transitions: [],
    transitionRequirements: {},
  },

  /**
   * CANCELLED - Cancelled (Terminal)
   * Editable by: SUPER_ADMIN only (for future features)
   */
  CANCELLED: {
    label: 'Cancelado',
    color: 'gray',
    editableFields: [],
    lockedFields: ['*'],
    transitions: [],
    transitionRequirements: {},
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
  careType: 'Tipo de Atención',
  diagnosisCode: 'Código Diagnóstico',
  diagnosisDescription: 'Descripción Diagnóstico',
  amountSubmitted: 'Monto Presentado',
  amountApproved: 'Monto Aprobado',
  amountDenied: 'Gastos No Elegibles',
  amountUnprocessed: 'Gastos No Procesados',
  deductibleApplied: 'Deducible Aplicado',
  copayApplied: 'Copago',
  incidentDate: 'Fecha de Incurrencia',
  submittedDate: 'Fecha de Presentación',
  settlementDate: 'Fecha de Liquidación',
  settlementNumber: 'Número de Liquidación',
  settlementNotes: 'Observaciones',
  businessDays: 'Días Laborables',
  policyId: 'Póliza',
  reprocessDate: 'Fecha de Reproceso',
  reprocessDescription: 'Descripción de Reproceso',
} as const

/**
 * Spanish labels for CareType enum values
 */
export const CARE_TYPE_LABELS = {
  AMBULATORY: 'Ambulatorio',
  HOSPITALIZATION: 'Hospitalización',
  MATERNITY: 'Maternidad',
  EMERGENCY: 'Emergencia',
  OTHER: 'Otro',
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

/**
 * Check if a status is a terminal state
 */
export function isTerminalState(status: ClaimStatus): boolean {
  return ['RETURNED', 'SETTLED', 'CANCELLED'].includes(status)
}
