/**
 * Invoice Lifecycle Blueprint
 *
 * Defines the state machine for invoice status transitions, including:
 * - Who can edit invoices in each state
 * - Which fields are editable per state
 * - Valid status transitions
 * - Required fields for each transition
 *
 * This is the single source of truth for invoice lifecycle business rules.
 * Used by:
 * - invoiceLifecycle.validator.ts (enforcement)
 * - invoiceEdit.service.ts (business logic)
 * - Frontend (UI state/permissions)
 */

import { BROKER_EMPLOYEES, SUPER_ADMIN_ONLY } from '../../../shared/constants/roles.js'

/**
 * Lifecycle rules for each invoice status
 *
 * Flow: PENDING → VALIDATED/DISCREPANCY → (resolution) → VALIDATED → PAID
 *       Any status → CANCELLED (terminal)
 *
 * Key decisions:
 * - PENDING: All data fields editable (can correct entry errors), no payment allowed
 * - VALIDATED: Only payment fields editable (data locked after validation)
 * - DISCREPANCY: Correction fields + payment fields editable (resolve variances)
 * - CANCELLED: Terminal state, only SUPER_ADMIN can add notes
 * - Payment status editable only in VALIDATED/DISCREPANCY (not PENDING)
 * - CLIENT_ADMIN cannot edit invoices (broker employees only)
 */
export const INVOICE_LIFECYCLE_BLUEPRINT = {
  PENDING: {
    /**
     * PENDING - Invoice uploaded, awaiting validation
     *
     * Context: Initial status when invoice is created/uploaded. All data entry
     * fields are editable to allow corrections. Validation has not been run yet,
     * so payment is not allowed (invoice not yet approved).
     */

    /** Spanish label for UI display */
    label: 'Pendiente',

    /** Only broker employees can edit pending invoices */
    allowedEditors: BROKER_EMPLOYEES,

    /** All data entry fields editable (can fix mistakes before validation) */
    editableFields: [
      'invoiceNumber',
      'insurerInvoiceNumber',
      'clientId',
      'insurerId',
      'billingPeriod',
      'totalAmount',
      'taxAmount',
      'actualAffiliateCount',
      'expectedAmount',
      'expectedAffiliateCount',
      'issueDate',
      'dueDate',
      'discrepancyNotes',
    ],

    /** Can transition to validated, discrepancy, or cancelled */
    allowedTransitions: ['VALIDATED', 'DISCREPANCY', 'CANCELLED'],

    /** Requirements for each transition */
    transitionRequirements: {
      VALIDATED: ['billingPeriod', 'taxAmount', 'actualAffiliateCount', 'dueDate'],
      DISCREPANCY: ['billingPeriod', 'taxAmount', 'actualAffiliateCount', 'dueDate'],
      CANCELLED: [],
    },
  },

  VALIDATED: {
    /**
     * VALIDATED - Amounts verified and approved for payment
     *
     * Context: Invoice has been validated (automatically or manually approved).
     * All data fields are locked. Only payment-related fields can be edited.
     * Can transition back to DISCREPANCY if error found later.
     */

    /** Spanish label for UI display */
    label: 'Validada',

    /** Only broker employees can edit validated invoices */
    allowedEditors: BROKER_EMPLOYEES,

    /** Only payment and notes editable (all data locked after validation) */
    editableFields: ['paymentStatus', 'paymentDate', 'discrepancyNotes'],

    /** Can transition to discrepancy (if error found) or cancelled */
    allowedTransitions: ['DISCREPANCY', 'CANCELLED'],

    /** No requirements for transitions from validated */
    transitionRequirements: {
      DISCREPANCY: [],
      CANCELLED: [],
    },
  },

  DISCREPANCY: {
    /**
     * DISCREPANCY - Variance detected, under review
     *
     * Context: Calculated amounts don't match insurer's invoice. Allows editing
     * correction fields to resolve the discrepancy, or manual override of expected
     * amounts if our data is wrong. Can approve payment despite variance if documented.
     */

    /** Spanish label for UI display */
    label: 'Discrepancia',

    /** Broker employees can edit (SUPER_ADMIN included in BROKER_EMPLOYEES) */
    allowedEditors: BROKER_EMPLOYEES,

    /** Correction fields + payment fields editable (resolve or override) */
    editableFields: [
      'discrepancyNotes',
      'expectedAmount',
      'actualAffiliateCount',
      'totalAmount',
      'taxAmount',
      'billingPeriod',
      'paymentStatus',
      'paymentDate',
    ],

    /** Can transition to validated (after resolution) or cancelled */
    allowedTransitions: ['VALIDATED', 'CANCELLED'],

    /** Must document resolution when approving */
    transitionRequirements: {
      VALIDATED: ['discrepancyNotes'],
      CANCELLED: [],
    },
  },

  CANCELLED: {
    /**
     * CANCELLED - Invoice voided/rejected (terminal state)
     *
     * Context: Invoice was duplicate, error, or rejected. Completely locked,
     * only SUPER_ADMIN can add notes for documentation. No transitions allowed.
     * Functions as soft delete.
     */

    /** Spanish label for UI display */
    label: 'Cancelada',

    /** Only SUPER_ADMIN can edit (to add cancellation notes) */
    allowedEditors: SUPER_ADMIN_ONLY,

    /** Only notes editable (for documentation) */
    editableFields: ['discrepancyNotes'],

    /** Terminal state - no transitions allowed */
    allowedTransitions: [],

    /** No requirements (terminal state) */
    transitionRequirements: {},
  },
} as const

/**
 * Type definitions for type-safe blueprint access
 */
export type InvoiceLifecycleState = keyof typeof INVOICE_LIFECYCLE_BLUEPRINT
export type InvoiceLifecycleRules = typeof INVOICE_LIFECYCLE_BLUEPRINT[InvoiceLifecycleState]
