/**
 * Policy Lifecycle Rules (Frontend)
 *
 * ⚠️⚠️⚠️ CRITICAL: MANUAL COPY FROM BACKEND BLUEPRINT ⚠️⚠️⚠️
 *
 * SOURCE FILE: api/src/features/policies/shared/policyLifecycle.blueprint.ts
 *
 * IF YOU CHANGE LIFECYCLE RULES IN THE BACKEND, YOU MUST MANUALLY UPDATE THIS FILE!
 *
 * Fields to keep in sync:
 * - editableFields arrays (which fields can be edited per status)
 * - transitions arrays (valid status changes)
 * - requirements arrays (fields needed before transitioning)
 * - status labels
 *
 * Last synced: 2025-11-11
 * Synced by: Juan Jalil
 *
 * TODO: Consider auto-generating this file from backend blueprint at build time
 */

import type { PolicyStatus } from '../types/policies'

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
  status: PolicyStatus
  /** Short label for UI (e.g., "Activar") */
  label: string
  /** Full button label (e.g., "✓ Activar Póliza") */
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
 * Policy lifecycle state machine rules
 *
 * Defines for each status:
 * - Which fields are editable
 * - Which fields are locked (shown but disabled)
 * - Valid status transitions
 * - Required fields before transitioning
 *
 * Flow: PENDING → ACTIVE → EXPIRED/CANCELLED
 */
export const POLICY_LIFECYCLE = {
  /**
   * PENDING - Initial state when policy is created
   * Editable by: BROKER_EMPLOYEES
   */
  PENDING: {
    label: 'Pendiente',
    color: 'yellow',
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
    lockedFields: [],
    transitions: [
      {
        status: 'ACTIVE' as PolicyStatus,
        label: 'Activar',
        buttonLabel: '✓ Activar Póliza',
        variant: 'success' as TransitionVariant,
        icon: '✓',
      },
    ],
    requirements: [
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

  /**
   * ACTIVE - Policy is active and providing coverage
   * Editable by: SUPER_ADMIN only
   */
  ACTIVE: {
    label: 'Activa',
    color: 'green',
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
    lockedFields: [],
    transitions: [
      {
        status: 'EXPIRED' as PolicyStatus,
        label: 'Marcar Vencida',
        buttonLabel: '⏱ Marcar como Vencida',
        variant: 'danger' as TransitionVariant,
        icon: '⏱',
      },
      {
        status: 'CANCELLED' as PolicyStatus,
        label: 'Cancelar',
        buttonLabel: '✗ Cancelar Póliza',
        variant: 'danger' as TransitionVariant,
        icon: '✗',
      },
    ],
    requirements: [],
  },

  /**
   * EXPIRED - Policy has expired (typically due to non-payment)
   * Editable by: SUPER_ADMIN only
   */
  EXPIRED: {
    label: 'Vencida',
    color: 'orange',
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
    lockedFields: [],
    transitions: [
      {
        status: 'ACTIVE' as PolicyStatus,
        label: 'Reactivar',
        buttonLabel: '↻ Reactivar Póliza',
        variant: 'success' as TransitionVariant,
        icon: '↻',
      },
      {
        status: 'CANCELLED' as PolicyStatus,
        label: 'Cancelar',
        buttonLabel: '✗ Cancelar Póliza',
        variant: 'danger' as TransitionVariant,
        icon: '✗',
      },
    ],
    requirements: [
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

  /**
   * CANCELLED - Terminal state (policy was cancelled)
   * Editable by: SUPER_ADMIN only
   */
  CANCELLED: {
    label: 'Cancelada',
    color: 'red',
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
    lockedFields: [],
    transitions: [],
    requirements: [],
  },
} as const

// ============================================================================
// FIELD LABELS
// ============================================================================

/**
 * Spanish labels for policy fields
 * Used for display in forms, error messages, and diff views
 */
export const FIELD_LABELS = {
  policyNumber: 'Número de Póliza',
  clientId: 'Cliente',
  insurerId: 'Aseguradora',
  type: 'Tipo de Póliza',
  ambCopay: 'Copago Ambulatorio',
  hospCopay: 'Copago Hospitalario',
  maternity: 'Cobertura Maternidad',
  tPremium: 'Prima T',
  tplus1Premium: 'Prima T+1',
  tplusfPremium: 'Prima T+F',
  taxRate: 'Tasa de Impuesto',
  additionalCosts: 'Costos Adicionales',
  startDate: 'Fecha de Inicio',
  endDate: 'Fecha de Fin',
} as const

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Valid lifecycle state keys
 */
export type PolicyLifecycleState = keyof typeof POLICY_LIFECYCLE

/**
 * Valid policy field keys
 */
export type PolicyField = keyof typeof FIELD_LABELS

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
