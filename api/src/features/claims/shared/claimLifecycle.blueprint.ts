/**
 * Claim Lifecycle Blueprint
 *
 * Defines the state machine for claim status transitions, including:
 * - Who can edit claims in each state
 * - Which fields are editable per state
 * - Valid status transitions
 * - Required fields for each transition
 *
 * This is the single source of truth for claim lifecycle business rules.
 * Used by:
 * - claimLifecycle.validator.ts (enforcement)
 * - claimEdit.service.ts (business logic)
 * - Frontend (UI state/permissions)
 *
 * 7-Status Workflow:
 * DRAFT → VALIDATION → SUBMITTED → SETTLED (normal flow)
 *                   ↘ RETURNED (if documents incomplete)
 *         SUBMITTED → PENDING_INFO → SUBMITTED (reprocess loop)
 * Any state → CANCELLED
 *
 * Terminal states: RETURNED, SETTLED, CANCELLED
 */

import { SENIOR_CLAIM_MANAGERS, SUPER_ADMIN_ONLY } from '../../../shared/constants/roles.js'

/**
 * Lifecycle rules for each claim status
 *
 * Flow:
 * - DRAFT → VALIDATION | CANCELLED
 * - VALIDATION → SUBMITTED | RETURNED | CANCELLED
 * - SUBMITTED → PENDING_INFO | SETTLED | CANCELLED
 * - PENDING_INFO → SUBMITTED | CANCELLED
 * - Terminal: RETURNED, SETTLED, CANCELLED
 *
 * Key decisions:
 * - Claims start in DRAFT status for data entry
 * - VALIDATION is internal review before sending to insurer
 * - SUBMITTED means sent to insurer (Tramitado)
 * - PENDING_INFO is for when insurer requests more information
 * - SETTLED is when settlement is received (terminal)
 * - RETURNED is when claim is returned by insurer (terminal)
 * - CANCELLED can be reached from any non-terminal state
 * - SUPER_ADMIN can access terminal states (future reopening capability)
 */
export const CLAIM_LIFECYCLE_BLUEPRINT = {
  /**
   * DRAFT - Initial state when claim is created
   *
   * Context: User is entering initial claim data. All basic fields
   * can be edited. Must complete required fields to move to VALIDATION.
   */
  DRAFT: {
    /** Spanish label for UI display */
    label: 'Borrador',

    /** Only senior managers can edit claims in this state */
    allowedEditors: SENIOR_CLAIM_MANAGERS,

    /** Fields that can be modified while in DRAFT state */
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

    /** Can transition to VALIDATION or be cancelled */
    allowedTransitions: ['VALIDATION', 'CANCELLED'],

    /** Required fields to move to VALIDATION */
    transitionRequirements: {
      VALIDATION: [
        'careType',
        'incidentDate',
        'submittedDate',
        'amountSubmitted',
        'diagnosisDescription',
      ],
      CANCELLED: [],
    },
  },

  /**
   * VALIDATION - Internal review before sending to insurer
   *
   * Context: Claim is being reviewed internally before submission.
   * Can make corrections or send to insurer. Can also return if
   * documents are incomplete.
   */
  VALIDATION: {
    /** Spanish label for UI display */
    label: 'Validación',

    /** Only senior managers can edit claims in this state */
    allowedEditors: SENIOR_CLAIM_MANAGERS,

    /** Same fields as DRAFT for corrections */
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

    /** Can submit to insurer, return, or cancel */
    allowedTransitions: ['SUBMITTED', 'RETURNED', 'CANCELLED'],

    /** Confirmation only for these transitions */
    transitionRequirements: {
      SUBMITTED: [],
      RETURNED: [],
      CANCELLED: [],
    },
  },

  /**
   * SUBMITTED - Sent to insurer (Tramitado)
   *
   * Context: Claim has been sent to insurer for processing.
   * Waiting for settlement or request for more information.
   * Only businessDays tracking field is editable.
   */
  SUBMITTED: {
    /** Spanish label for UI display */
    label: 'Tramitado',

    /** Only senior managers can edit claims in this state */
    allowedEditors: SENIOR_CLAIM_MANAGERS,

    /** Tracking and settlement fields editable */
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

    /** Can receive settlement, request for info, or be cancelled */
    allowedTransitions: ['PENDING_INFO', 'SETTLED', 'CANCELLED'],

    /** Settlement requires financial fields */
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
   *
   * Context: Insurer has returned claim requesting additional
   * documentation or information. When resolved, creates a
   * ClaimReprocess record and returns to SUBMITTED.
   */
  PENDING_INFO: {
    /** Spanish label for UI display */
    label: 'Pendiente Info',

    /** Only senior managers can edit claims in this state */
    allowedEditors: SENIOR_CLAIM_MANAGERS,

    /** Can edit data fields while gathering information */
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

    /** Can resubmit or cancel */
    allowedTransitions: ['SUBMITTED', 'CANCELLED'],

    /** Resubmission requires reprocess documentation */
    transitionRequirements: {
      SUBMITTED: ['reprocessDate', 'reprocessDescription'],
      CANCELLED: [],
    },
  },

  /**
   * RETURNED - Returned by insurer (Terminal)
   *
   * Context: Claim has been permanently returned by insurer.
   * This is a terminal state with no edits allowed.
   * SUPER_ADMIN access exists for future reopening capability.
   */
  RETURNED: {
    /** Spanish label for UI display */
    label: 'Devuelto',

    /** Only super admin can access (for future features) */
    allowedEditors: SUPER_ADMIN_ONLY,

    /** No fields editable - terminal state is locked */
    editableFields: [],

    /** No transitions allowed - terminal state */
    allowedTransitions: [],

    /** No requirements - cannot transition from this state */
    transitionRequirements: {},
  },

  /**
   * SETTLED - Settlement received (Terminal)
   *
   * Context: Claim has been settled by insurer. Settlement
   * amounts and details are recorded. This is a terminal state
   * with no edits allowed.
   * SUPER_ADMIN access exists for future reopening capability.
   */
  SETTLED: {
    /** Spanish label for UI display */
    label: 'Liquidado',

    /** Only super admin can access (for future features) */
    allowedEditors: SUPER_ADMIN_ONLY,

    /** No fields editable - terminal state is locked */
    editableFields: [],

    /** No transitions allowed - terminal state */
    allowedTransitions: [],

    /** No requirements - cannot transition from this state */
    transitionRequirements: {},
  },

  /**
   * CANCELLED - Cancelled (Terminal)
   *
   * Context: Claim has been cancelled. This is a terminal state
   * with no edits allowed.
   * SUPER_ADMIN access exists for future reopening capability.
   */
  CANCELLED: {
    /** Spanish label for UI display */
    label: 'Cancelado',

    /** Only super admin can access (for future features) */
    allowedEditors: SUPER_ADMIN_ONLY,

    /** No fields editable - terminal state is locked */
    editableFields: [],

    /** No transitions allowed - terminal state */
    allowedTransitions: [],

    /** No requirements - cannot transition from this state */
    transitionRequirements: {},
  },
} as const

/**
 * Type definitions for type-safe blueprint access
 */
export type ClaimLifecycleState = keyof typeof CLAIM_LIFECYCLE_BLUEPRINT
export type ClaimLifecycleRules = (typeof CLAIM_LIFECYCLE_BLUEPRINT)[ClaimLifecycleState]

/**
 * Terminal states that cannot be edited or transitioned from
 */
export const TERMINAL_STATES: ClaimLifecycleState[] = ['RETURNED', 'SETTLED', 'CANCELLED']

/**
 * Check if a status is a terminal state
 */
export function isTerminalState(status: ClaimLifecycleState): boolean {
  return TERMINAL_STATES.includes(status)
}
