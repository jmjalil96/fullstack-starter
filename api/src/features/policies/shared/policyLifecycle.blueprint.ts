/**
 * Policy Lifecycle Blueprint
 *
 * Defines the state machine for policy status transitions, including:
 * - Who can edit policies in each state
 * - Which fields are editable per state
 * - Valid status transitions
 * - Required fields for each transition
 *
 * This is the single source of truth for policy lifecycle business rules.
 * Used by:
 * - policyLifecycle.validator.ts (enforcement)
 * - policyEdit.service.ts (business logic)
 * - Frontend (UI state/permissions)
 */

import { BROKER_EMPLOYEES, SUPER_ADMIN_ONLY } from '../../../shared/constants/roles.js'

/**
 * Lifecycle rules for each policy status
 *
 * Flow: PENDING → ACTIVE → EXPIRED/CANCELLED
 *
 * Key decisions:
 * - BROKER_EMPLOYEES can fully configure policies in PENDING
 * - All fields must be complete before activation
 * - Only SUPER_ADMIN can edit ACTIVE/EXPIRED/CANCELLED policies
 * - EXPIRED policies can be reactivated (if paid)
 * - CANCELLED is terminal (no transitions)
 * - SUPER_ADMIN can edit all fields in all statuses
 */
export const POLICY_LIFECYCLE_BLUEPRINT = {
  /**
   * PENDING - Initial state when policy is created
   *
   * Context: Policy is being configured with coverage details, premiums, and copays.
   * Broker employees will fill all required information before activating.
   */
  PENDING: {
    /** Spanish label for UI display */
    label: 'Pendiente',

    /** Broker employees can configure pending policies */
    allowedEditors: BROKER_EMPLOYEES,

    /** All fields editable during configuration */
    editableFields: [
      'policyNumber',
      'clientId',
      'insurerId',
      'type',
      'ambCopay',
      'hospCopay',
      'maternity',
      'tPremium',
      'tplus1Premium',
      'tplusfPremium',
      'taxRate',
      'additionalCosts',
      'startDate',
      'endDate',
    ],

    /** Can only transition to ACTIVE */
    allowedTransitions: ['ACTIVE'],

    /** All fields must be complete to activate */
    transitionRequirements: {
      ACTIVE: [
        'policyNumber',
        'clientId',
        'insurerId',
        'type',
        'ambCopay',
        'hospCopay',
        'maternity',
        'tPremium',
        'tplus1Premium',
        'tplusfPremium',
        'taxRate',
        'additionalCosts',
        'startDate',
        'endDate',
      ],
    },
  },

  /**
   * ACTIVE - Policy is active and providing coverage
   *
   * Context: Policy is in effect. Only SUPER_ADMIN can make adjustments.
   * Can transition to EXPIRED (if unpaid) or CANCELLED (by admin decision).
   */
  ACTIVE: {
    /** Spanish label for UI display */
    label: 'Activa',

    /** Only SUPER_ADMIN can edit active policies */
    allowedEditors: SUPER_ADMIN_ONLY,

    /** SUPER_ADMIN can edit all fields */
    editableFields: [
      'policyNumber',
      'clientId',
      'insurerId',
      'type',
      'ambCopay',
      'hospCopay',
      'maternity',
      'tPremium',
      'tplus1Premium',
      'tplusfPremium',
      'taxRate',
      'additionalCosts',
      'startDate',
      'endDate',
    ],

    /** Can transition to EXPIRED or CANCELLED */
    allowedTransitions: ['EXPIRED', 'CANCELLED'],

    /** No requirements for transitions */
    transitionRequirements: {
      EXPIRED: [],
      CANCELLED: [],
    },
  },

  /**
   * EXPIRED - Policy has expired (typically due to non-payment)
   *
   * Context: Policy coverage has lapsed. Can be reactivated if payment is received,
   * or moved to CANCELLED if client decides not to renew.
   */
  EXPIRED: {
    /** Spanish label for UI display */
    label: 'Vencida',

    /** Only SUPER_ADMIN can edit expired policies */
    allowedEditors: SUPER_ADMIN_ONLY,

    /** SUPER_ADMIN can edit all fields */
    editableFields: [
      'policyNumber',
      'clientId',
      'insurerId',
      'type',
      'ambCopay',
      'hospCopay',
      'maternity',
      'tPremium',
      'tplus1Premium',
      'tplusfPremium',
      'taxRate',
      'additionalCosts',
      'startDate',
      'endDate',
    ],

    /** Can be reactivated or cancelled */
    allowedTransitions: ['ACTIVE', 'CANCELLED'],

    /** All fields must be complete to reactivate */
    transitionRequirements: {
      ACTIVE: [
        'policyNumber',
        'clientId',
        'insurerId',
        'type',
        'ambCopay',
        'hospCopay',
        'maternity',
        'tPremium',
        'tplus1Premium',
        'tplusfPremium',
        'taxRate',
        'additionalCosts',
        'startDate',
        'endDate',
      ],
      CANCELLED: [],
    },
  },

  /**
   * CANCELLED - Terminal state (policy was cancelled)
   *
   * Context: Policy has been permanently cancelled. SUPER_ADMIN can still edit
   * fields for corrections, but no transitions are allowed.
   */
  CANCELLED: {
    /** Spanish label for UI display */
    label: 'Cancelada',

    /** Only SUPER_ADMIN can access cancelled policies */
    allowedEditors: SUPER_ADMIN_ONLY,

    /** SUPER_ADMIN can edit all fields even in terminal state */
    editableFields: [
      'policyNumber',
      'clientId',
      'insurerId',
      'type',
      'ambCopay',
      'hospCopay',
      'maternity',
      'tPremium',
      'tplus1Premium',
      'tplusfPremium',
      'taxRate',
      'additionalCosts',
      'startDate',
      'endDate',
    ],

    /** No transitions allowed - terminal state */
    allowedTransitions: [],

    /** No requirements - cannot transition from this state */
    transitionRequirements: {},
  },
} as const

/**
 * Type definitions for type-safe blueprint access
 */
export type PolicyLifecycleState = keyof typeof POLICY_LIFECYCLE_BLUEPRINT
export type PolicyLifecycleRules = typeof POLICY_LIFECYCLE_BLUEPRINT[PolicyLifecycleState]
