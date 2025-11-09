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
 */

import { SENIOR_CLAIM_MANAGERS, SUPER_ADMIN_ONLY } from '../../../shared/constants/roles.js'

/**
 * Lifecycle rules for each claim status
 *
 * Flow: SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED (terminal)
 *
 * Key decisions:
 * - Only SENIOR_CLAIM_MANAGERS can create and edit claims
 * - APPROVED and REJECTED are terminal states (no transitions)
 * - SUPER_ADMIN can access terminal states (future reopening capability)
 * - approvedAmount required for both APPROVED and REJECTED (can be 0 for rejection)
 * - submittedDate is manually entered (not auto-set)
 * - All validation enforced at application layer, not database
 */
export const CLAIM_LIFECYCLE_BLUEPRINT = {
  /**
   * SUBMITTED - Initial state when claim is created
   *
   * Context: Claim has been submitted and is awaiting initial review.
   * Staff will verify all required information is present before moving to review.
   */
  SUBMITTED: {
    /** Spanish label for UI display */
    label: 'Enviado',

    /** Only senior managers can edit claims in this state */
    allowedEditors: SENIOR_CLAIM_MANAGERS,

    /** Fields that can be modified while in SUBMITTED state */
    editableFields: [
      'description',
      'amount',
      'policyId',
      'incidentDate',
      'type',
      'submittedDate',
    ],

    /** Can only transition to UNDER_REVIEW */
    allowedTransitions: ['UNDER_REVIEW'],

    /** All base fields must be filled to move to review */
    transitionRequirements: {
      UNDER_REVIEW: [
        'description',
        'amount',
        'policyId',
        'incidentDate',
        'type',
        'submittedDate',
      ],
    },
  },

  /**
   * UNDER_REVIEW - Claim is being actively reviewed
   *
   * Context: Senior managers are evaluating the claim to determine
   * approval amount and final decision (approve or reject).
   */
  UNDER_REVIEW: {
    /** Spanish label for UI display */
    label: 'En Revisión',

    /** Only senior managers can edit claims in this state */
    allowedEditors: SENIOR_CLAIM_MANAGERS,

    /** Only approval-related fields are editable during review */
    editableFields: ['approvedAmount', 'resolvedDate'],

    /** Can transition to final decision (approved or rejected) */
    allowedTransitions: ['APPROVED', 'REJECTED'],

    /** Both outcomes require approved amount and resolution date */
    transitionRequirements: {
      APPROVED: [
        'description',
        'amount',
        'policyId',
        'incidentDate',
        'type',
        'submittedDate',
        'approvedAmount',
        'resolvedDate',
      ],
      REJECTED: [
        'description',
        'amount',
        'policyId',
        'incidentDate',
        'type',
        'submittedDate',
        'approvedAmount', // Can be 0 for full rejection
        'resolvedDate',
      ],
    },
  },

  /**
   * APPROVED - Terminal state (claim was approved)
   *
   * Context: Claim has been approved. This is a final state with no edits allowed.
   * SUPER_ADMIN access exists for future reopening/reversal capability.
   */
  APPROVED: {
    /** Spanish label for UI display */
    label: 'Aprobado',

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
   * REJECTED - Terminal state (claim was rejected)
   *
   * Context: Claim has been rejected. This is a final state with no edits allowed.
   * SUPER_ADMIN access exists for future reopening/reversal capability.
   */
  REJECTED: {
    /** Spanish label for UI display */
    label: 'Rechazado',

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
export type ClaimLifecycleRules = typeof CLAIM_LIFECYCLE_BLUEPRINT[ClaimLifecycleState]
