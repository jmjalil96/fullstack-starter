/**
 * employeeDetail.service.ts
 * Service for getting employee details with role-based authorization
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { EmployeeDetailResponse } from './employeeDetail.dto.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User context type (returned from getUserWithContext)
 */
interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Get employee details by ID
 *
 * Role-based authorization:
 * - BROKER_EMPLOYEES only: Can view any employee
 * - CLIENT_ADMIN and AFFILIATE: 403 Forbidden (admin feature)
 *
 * @param userId - ID of user requesting employee details
 * @param employeeId - ID of the employee to retrieve
 * @returns Complete employee details
 * @throws {UnauthorizedError} If user not found
 * @throws {ForbiddenError} If user role cannot view employees
 * @throws {NotFoundError} If employee not found
 */
export async function getEmployeeById(
  userId: string,
  employeeId: string
): Promise<EmployeeDetailResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check (BROKER_EMPLOYEES only)
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName, employeeId }, 'Unauthorized employee detail access attempt')
    throw new ForbiddenError('No tienes permiso para ver empleados')
  }

  // STEP 3: Load Employee
  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      position: true,
      department: true,
      employeeCode: true,
      userId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  // STEP 4: Validate Employee Exists
  if (!employee) {
    logger.warn({ userId, employeeId }, 'Employee not found')
    throw new NotFoundError('Empleado no encontrado')
  }

  // STEP 5: Transform to Response DTO
  const response: EmployeeDetailResponse = {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    position: employee.position,
    department: employee.department,
    employeeCode: employee.employeeCode,
    userId: employee.userId,
    hasUserAccount: employee.userId !== null,
    isActive: employee.isActive,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  }

  // STEP 6: Log Activity
  logger.info(
    {
      userId,
      role: roleName,
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
    },
    'Employee detail retrieved'
  )

  // STEP 7: Return Response
  return response
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load user with role context
 *
 * @param userId - User ID to load
 * @returns User with role data
 */
async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      globalRole: {
        select: { name: true },
      },
    },
  })
}
