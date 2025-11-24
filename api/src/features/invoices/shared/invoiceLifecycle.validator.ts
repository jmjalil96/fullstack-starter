/**
 * Invoice Lifecycle Validator
 *
 * Enforcement engine for invoice lifecycle business rules.
 * Reads from the blueprint and makes validation decisions.
 *
 * Responsibilities:
 * - Validate role-based edit permissions
 * - Validate field-level edit restrictions
 * - Validate status transition rules
 * - Validate transition requirements (merged state)
 *
 * Design principles:
 * - Pure functions (no side effects)
 * - No database access
 * - No error throwing (returns data, service decides to throw)
 * - Type-safe with InvoiceStatus
 *
 * Usage example:
 * ```typescript
 * const validator = new InvoiceLifecycleValidator()
 *
 * // Check if user can edit
 * if (!validator.canUserEdit(user.role, invoice.status)) {
 *   throw new ForbiddenError('Cannot edit invoices in this status')
 * }
 *
 * // Check for forbidden fields
 * const forbidden = validator.forbiddenFields(updates, invoice.status)
 * if (forbidden.length > 0) {
 *   throw new BadRequestError(`Cannot edit: ${forbidden.join(', ')}`)
 * }
 *
 * // Check if transition is valid
 * if (!validator.canTransition(invoice.status, updates.status)) {
 *   throw new BadRequestError('Invalid status transition')
 * }
 *
 * // Check for missing requirements
 * const missing = validator.missingRequirements(invoice, updates, updates.status)
 * if (missing.length > 0) {
 *   throw new BadRequestError(`Missing: ${missing.join(', ')}`)
 * }
 * ```
 */

import type { InvoiceStatus } from '@prisma/client'

import { INVOICE_LIFECYCLE_BLUEPRINT } from './invoiceLifecycle.blueprint.js'

/**
 * Validator class for invoice lifecycle business rules
 */
export class InvoiceLifecycleValidator {
  /**
   * Check if a role can edit invoices in a given status
   *
   * @param role - User's role name (e.g., 'SUPER_ADMIN', 'CLAIMS_EMPLOYEE')
   * @param status - Current invoice status
   * @returns true if role is allowed to edit, false otherwise
   *
   * @example
   * canUserEdit('SUPER_ADMIN', 'PENDING') // true (broker employee)
   * canUserEdit('CLAIMS_EMPLOYEE', 'VALIDATED') // true (broker employee)
   * canUserEdit('CLIENT_ADMIN', 'PENDING') // false (not allowed)
   * canUserEdit('SUPER_ADMIN', 'CANCELLED') // true (super admin only)
   */
  canUserEdit(role: string, status: InvoiceStatus): boolean {
    const rules = INVOICE_LIFECYCLE_BLUEPRINT[status]
    if (!rules) return false

    return rules.allowedEditors.includes(role as never)
  }

  /**
   * Get list of fields that cannot be edited in current status
   *
   * @param updates - Object containing fields to update
   * @param status - Current invoice status
   * @returns Array of forbidden field names (empty if all allowed)
   *
   * @example
   * // Trying to edit totalAmount in VALIDATED
   * forbiddenFields({ totalAmount: 5000 }, 'VALIDATED')
   * // Returns: ['totalAmount']
   *
   * // Trying to edit paymentStatus in VALIDATED
   * forbiddenFields({ paymentStatus: 'PAID' }, 'VALIDATED')
   * // Returns: []
   *
   * // Multiple fields, some forbidden
   * forbiddenFields({ paymentStatus: 'PAID', totalAmount: 5000 }, 'VALIDATED')
   * // Returns: ['totalAmount']
   */
  forbiddenFields(updates: Record<string, unknown>, status: InvoiceStatus): string[] {
    const rules = INVOICE_LIFECYCLE_BLUEPRINT[status]
    if (!rules) return Object.keys(updates) // If no rules, all forbidden

    const editableFields = rules.editableFields as readonly string[]
    const updateKeys = Object.keys(updates)

    return updateKeys.filter((key) => !editableFields.includes(key))
  }

  /**
   * Check if a status transition is valid
   *
   * @param from - Current invoice status
   * @param to - Desired new status
   * @returns true if transition is allowed, false otherwise
   *
   * @example
   * canTransition('PENDING', 'VALIDATED') // true
   * canTransition('PENDING', 'PAID') // false (PAID not in enum)
   * canTransition('VALIDATED', 'DISCREPANCY') // true
   * canTransition('CANCELLED', 'PENDING') // false (terminal state)
   */
  canTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
    const rules = INVOICE_LIFECYCLE_BLUEPRINT[from]
    if (!rules) return false

    return rules.allowedTransitions.includes(to as never)
  }

  /**
   * Get list of required fields missing for a status transition
   *
   * Validates against the MERGED state (current + updates), not just current DB state.
   * This allows setting required fields and status in the same request.
   *
   * @param current - Current invoice data from database
   * @param updates - Proposed updates to apply
   * @param to - Desired new status
   * @returns Array of missing required field names (empty if all present)
   *
   * @example
   * // Current invoice missing dueDate, trying to transition
   * missingRequirements(
   *   { status: 'PENDING', billingPeriod: '2025-01', dueDate: null },
   *   { status: 'VALIDATED' },
   *   'VALIDATED'
   * )
   * // Returns: ['dueDate', 'taxAmount', 'actualAffiliateCount'] (still null in merged state)
   *
   * // Setting dueDate AND status in same request
   * missingRequirements(
   *   { status: 'PENDING', billingPeriod: '2025-01', dueDate: null },
   *   { status: 'VALIDATED', dueDate: '2025-03-15', taxAmount: 2700, actualAffiliateCount: 30 },
   *   'VALIDATED'
   * )
   * // Returns: [] (all requirements now present in merged state)
   */
  missingRequirements(
    current: Record<string, unknown>,
    updates: Record<string, unknown>,
    to: InvoiceStatus
  ): string[] {
    const fromStatus = (current.status as InvoiceStatus) || 'PENDING'
    const rules = INVOICE_LIFECYCLE_BLUEPRINT[fromStatus]
    if (!rules) return []

    // Get requirements for this specific transition
    const requirements = rules.transitionRequirements[to as keyof typeof rules.transitionRequirements]
    if (!requirements) return []

    // Merge current state with updates to get prospective state
    const mergedState = this.mergeState(current, updates)

    // Filter for fields that are null, undefined, or empty string
    return (requirements as readonly string[]).filter((field) => {
      const value = mergedState[field]
      return value === null || value === undefined || value === ''
    })
  }

  /**
   * Merge current state with updates to get prospective state
   *
   * @param current - Current invoice data
   * @param updates - Proposed updates
   * @returns Merged object (current + updates)
   * @private
   */
  private mergeState(
    current: Record<string, unknown>,
    updates: Record<string, unknown>
  ): Record<string, unknown> {
    return { ...current, ...updates }
  }
}
