/**
 * Claim Lifecycle Validator
 *
 * Enforcement engine for claim lifecycle business rules.
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
 * - Type-safe with ClaimStatus
 *
 * Usage example:
 * ```typescript
 * const validator = new ClaimLifecycleValidator()
 *
 * // Check if user can edit
 * if (!validator.canUserEdit(user.role, claim.status)) {
 *   throw new ForbiddenError('Cannot edit claims in this status')
 * }
 *
 * // Check for forbidden fields
 * const forbidden = validator.forbiddenFields(updates, claim.status)
 * if (forbidden.length > 0) {
 *   throw new BadRequestError(`Cannot edit: ${forbidden.join(', ')}`)
 * }
 *
 * // Check if transition is valid
 * if (!validator.canTransition(claim.status, updates.status)) {
 *   throw new BadRequestError('Invalid status transition')
 * }
 *
 * // Check for missing requirements
 * const missing = validator.missingRequirements(claim, updates, updates.status)
 * if (missing.length > 0) {
 *   throw new BadRequestError(`Missing: ${missing.join(', ')}`)
 * }
 * ```
 */

import type { ClaimStatus } from '../views/viewClaims.dto.js'

import { CLAIM_LIFECYCLE_BLUEPRINT } from './claimLifecycle.blueprint.js'

/**
 * Validator class for claim lifecycle business rules
 */
export class ClaimLifecycleValidator {
  /**
   * Check if a role can edit claims in a given status
   *
   * @param role - User's role name (e.g., 'SUPER_ADMIN', 'CLAIMS_EMPLOYEE')
   * @param status - Current claim status
   * @returns true if role is allowed to edit, false otherwise
   *
   * @example
   * canUserEdit('OPERATIONS_EMPLOYEE', 'SUBMITTED') // false (not in SENIOR_CLAIM_MANAGERS)
   * canUserEdit('CLAIMS_EMPLOYEE', 'SUBMITTED')    // true (in SENIOR_CLAIM_MANAGERS)
   * canUserEdit('SUPER_ADMIN', 'APPROVED')         // true (in SUPER_ADMIN_ONLY)
   */
  canUserEdit(role: string, status: ClaimStatus): boolean {
    const rules = CLAIM_LIFECYCLE_BLUEPRINT[status]
    if (!rules) return false

    return rules.allowedEditors.includes(role as never)
  }

  /**
   * Get list of fields that cannot be edited in current status
   *
   * @param updates - Object containing fields to update
   * @param status - Current claim status
   * @returns Array of forbidden field names (empty if all allowed)
   *
   * @example
   * // Trying to edit approvedAmount in SUBMITTED
   * forbiddenFields({ approvedAmount: 100 }, 'SUBMITTED')
   * // Returns: ['approvedAmount']
   *
   * // Trying to edit description in SUBMITTED
   * forbiddenFields({ description: 'Updated' }, 'SUBMITTED')
   * // Returns: [] (allowed)
   *
   * // Multiple fields, some forbidden
   * forbiddenFields({ description: 'x', approvedAmount: 100 }, 'SUBMITTED')
   * // Returns: ['approvedAmount']
   */
  forbiddenFields(updates: Record<string, unknown>, status: ClaimStatus): string[] {
    const rules = CLAIM_LIFECYCLE_BLUEPRINT[status]
    if (!rules) return Object.keys(updates) // If no rules, all forbidden

    const editableFields = rules.editableFields as readonly string[]
    const updateKeys = Object.keys(updates)

    return updateKeys.filter((key) => !editableFields.includes(key))
  }

  /**
   * Check if a status transition is valid
   *
   * @param from - Current claim status
   * @param to - Desired new status
   * @returns true if transition is allowed, false otherwise
   *
   * @example
   * canTransition('SUBMITTED', 'UNDER_REVIEW') // true
   * canTransition('SUBMITTED', 'APPROVED')     // false (must go through UNDER_REVIEW)
   * canTransition('APPROVED', 'REJECTED')      // false (APPROVED is terminal)
   */
  canTransition(from: ClaimStatus, to: ClaimStatus): boolean {
    const rules = CLAIM_LIFECYCLE_BLUEPRINT[from]
    if (!rules) return false

    return rules.allowedTransitions.includes(to as never)
  }

  /**
   * Get list of required fields missing for a status transition
   *
   * Validates against the MERGED state (current + updates), not just current DB state.
   * This allows setting required fields and status in the same request.
   *
   * @param current - Current claim data from database
   * @param updates - Proposed updates to apply
   * @param to - Desired new status
   * @returns Array of missing required field names (empty if all present)
   *
   * @example
   * // Current claim missing policyId, trying to transition
   * missingRequirements(
   *   { description: 'x', amount: 100, policyId: null },
   *   { status: 'UNDER_REVIEW' },
   *   'UNDER_REVIEW'
   * )
   * // Returns: ['policyId', ...] (still null in merged state)
   *
   * // Setting policyId AND status in same request
   * missingRequirements(
   *   { description: 'x', amount: 100, policyId: null },
   *   { status: 'UNDER_REVIEW', policyId: 'abc123' },
   *   'UNDER_REVIEW'
   * )
   * // Returns: [] (policyId now present in merged state)
   */
  missingRequirements(
    current: Record<string, unknown>,
    updates: Record<string, unknown>,
    to: ClaimStatus
  ): string[] {
    const fromStatus = (current.status as ClaimStatus) || 'SUBMITTED'
    const rules = CLAIM_LIFECYCLE_BLUEPRINT[fromStatus]
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
   * @param current - Current claim data
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
