/**
 * Policy Lifecycle Validator
 *
 * Enforcement engine for policy lifecycle business rules.
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
 * - Type-safe with PolicyStatus
 *
 * Usage example:
 * ```typescript
 * const validator = new PolicyLifecycleValidator()
 *
 * // Check if user can edit
 * if (!validator.canUserEdit(user.role, policy.status)) {
 *   throw new ForbiddenError('Cannot edit policies in this status')
 * }
 *
 * // Check for forbidden fields
 * const forbidden = validator.forbiddenFields(updates, policy.status)
 * if (forbidden.length > 0) {
 *   throw new BadRequestError(`Cannot edit: ${forbidden.join(', ')}`)
 * }
 *
 * // Check if transition is valid
 * if (!validator.canTransition(policy.status, updates.status)) {
 *   throw new BadRequestError('Invalid status transition')
 * }
 *
 * // Check for missing requirements
 * const missing = validator.missingRequirements(policy, updates, updates.status)
 * if (missing.length > 0) {
 *   throw new BadRequestError(`Missing: ${missing.join(', ')}`)
 * }
 * ```
 */

import type { PolicyStatus } from '../views/viewPolicies.dto.js'

import { POLICY_LIFECYCLE_BLUEPRINT } from './policyLifecycle.blueprint.js'

/**
 * Validator class for policy lifecycle business rules
 */
export class PolicyLifecycleValidator {
  /**
   * Check if a role can edit policies in a given status
   *
   * @param role - User's role name (e.g., 'SUPER_ADMIN', 'CLAIMS_EMPLOYEE')
   * @param status - Current policy status
   * @returns true if role is allowed to edit, false otherwise
   *
   * @example
   * canUserEdit('OPERATIONS_EMPLOYEE', 'PENDING')  // true (in BROKER_EMPLOYEES)
   * canUserEdit('CLAIMS_EMPLOYEE', 'ACTIVE')       // false (not SUPER_ADMIN)
   * canUserEdit('SUPER_ADMIN', 'ACTIVE')           // true
   */
  canUserEdit(role: string, status: PolicyStatus): boolean {
    const rules = POLICY_LIFECYCLE_BLUEPRINT[status]
    if (!rules) return false

    return rules.allowedEditors.includes(role as never)
  }

  /**
   * Get list of fields that cannot be edited in current status
   *
   * @param updates - Object containing fields to update
   * @param status - Current policy status
   * @returns Array of forbidden field names (empty if all allowed)
   *
   * @example
   * // Trying to edit clientId in ACTIVE (SUPER_ADMIN can edit all)
   * forbiddenFields({ clientId: 'x' }, 'ACTIVE')
   * // Returns: [] (allowed for SUPER_ADMIN)
   *
   * // Trying to edit type in PENDING
   * forbiddenFields({ type: 'Dental' }, 'PENDING')
   * // Returns: [] (allowed for BROKER_EMPLOYEES)
   *
   * // Multiple fields, all allowed in PENDING
   * forbiddenFields({ type: 'x', ambCopay: 100 }, 'PENDING')
   * // Returns: [] (all allowed)
   */
  forbiddenFields(updates: Record<string, unknown>, status: PolicyStatus): string[] {
    const rules = POLICY_LIFECYCLE_BLUEPRINT[status]
    if (!rules) return Object.keys(updates) // If no rules, all forbidden

    const editableFields = rules.editableFields as readonly string[]
    const updateKeys = Object.keys(updates)

    return updateKeys.filter((key) => !editableFields.includes(key))
  }

  /**
   * Check if a status transition is valid
   *
   * @param from - Current policy status
   * @param to - Desired new status
   * @returns true if transition is allowed, false otherwise
   *
   * @example
   * canTransition('PENDING', 'ACTIVE')     // true
   * canTransition('PENDING', 'CANCELLED')  // false (must go through ACTIVE)
   * canTransition('ACTIVE', 'EXPIRED')     // true
   * canTransition('CANCELLED', 'ACTIVE')   // false (CANCELLED is terminal)
   */
  canTransition(from: PolicyStatus, to: PolicyStatus): boolean {
    const rules = POLICY_LIFECYCLE_BLUEPRINT[from]
    if (!rules) return false

    return rules.allowedTransitions.includes(to as never)
  }

  /**
   * Get list of required fields missing for a status transition
   *
   * Validates against the MERGED state (current + updates), not just current DB state.
   * This allows setting required fields and status in the same request.
   *
   * @param current - Current policy data from database
   * @param updates - Proposed updates to apply
   * @param to - Desired new status
   * @returns Array of missing required field names (empty if all present)
   *
   * @example
   * // Current policy missing type, trying to activate
   * missingRequirements(
   *   { policyNumber: 'POL-001', type: null, ambCopay: 100 },
   *   { status: 'ACTIVE' },
   *   'ACTIVE'
   * )
   * // Returns: ['type', 'hospCopay', ...] (still null in merged state)
   *
   * // Setting type AND status in same request
   * missingRequirements(
   *   { policyNumber: 'POL-001', type: null, ambCopay: 100 },
   *   { status: 'ACTIVE', type: 'Salud', hospCopay: 50 },
   *   'ACTIVE'
   * )
   * // Returns: remaining null fields
   */
  missingRequirements(
    current: Record<string, unknown>,
    updates: Record<string, unknown>,
    to: PolicyStatus
  ): string[] {
    const fromStatus = (current.status as PolicyStatus) || 'PENDING'
    const rules = POLICY_LIFECYCLE_BLUEPRINT[fromStatus]
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
   * @param current - Current policy data
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
