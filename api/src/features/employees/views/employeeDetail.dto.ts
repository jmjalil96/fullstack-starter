/**
 * DTO for employee detail view (GET /api/employees/:id)
 */

/**
 * Complete employee detail with all fields from Employee table
 *
 * Follows flat structure pattern for consistency
 */
export interface EmployeeDetailResponse {
  // ============================================================================
  // EMPLOYEE TABLE - ALL FIELDS
  // ============================================================================

  /** Unique employee ID (CUID) */
  id: string

  /** First name */
  firstName: string

  /** Last name */
  lastName: string

  /** Email address */
  email: string

  /** Phone number */
  phone: string | null

  /** Job position/title */
  position: string | null

  /** Department name */
  department: string | null

  /** Unique employee code */
  employeeCode: string | null

  // User account link
  /** Linked user ID (if has account) */
  userId: string | null

  /** Whether employee has a user account */
  hasUserAccount: boolean

  // Status
  /** Whether employee is active */
  isActive: boolean

  // Timestamps (ISO strings)
  /** When the employee was created */
  createdAt: string

  /** When the employee was last updated */
  updatedAt: string
}
