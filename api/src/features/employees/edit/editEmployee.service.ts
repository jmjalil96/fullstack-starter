/**
 * editEmployee.service.ts
 * Service for editing employee information
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type { EditEmployeeResponse } from './editEmployee.dto.js'
import type { EditEmployeeInput } from './editEmployee.schema.js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserContext {
  id: string
  globalRole: { name: string } | null
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Edit an employee's information
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES can edit employees
 */
export async function editEmployee(
  userId: string,
  employeeId: string,
  data: EditEmployeeInput
): Promise<EditEmployeeResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized employee edit attempt')
    throw new ForbiddenError('No tienes permiso para editar empleados')
  }

  // STEP 3: Find Employee
  const employee = await db.employee.findUnique({
    where: { id: employeeId },
  })

  if (!employee) {
    throw new NotFoundError('Empleado no encontrado')
  }

  // STEP 4: Validate Employee Code Uniqueness (if changing)
  if (data.employeeCode && data.employeeCode !== employee.employeeCode) {
    const existing = await db.employee.findUnique({
      where: { employeeCode: data.employeeCode },
    })
    if (existing) {
      throw new ConflictError('El código de empleado ya está en uso')
    }
  }

  // STEP 5: Update Employee and Handle Deactivation
  const isDeactivating = data.isActive === false && employee.isActive === true

  const updated = await db.$transaction(async (tx) => {
    // Update employee
    const result = await tx.employee.update({
      where: { id: employeeId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.position !== undefined && { position: data.position }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.employeeCode !== undefined && { employeeCode: data.employeeCode }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    // If deactivating and employee has a user account, delete their sessions
    if (isDeactivating && employee.userId) {
      await tx.session.deleteMany({
        where: { userId: employee.userId },
      })
    }

    return result
  })

  logger.info({ userId, employeeId, changes: data, deactivated: isDeactivating }, 'Employee edited')

  return {
    id: updated.id,
    firstName: updated.firstName,
    lastName: updated.lastName,
    email: updated.email,
    phone: updated.phone,
    position: updated.position,
    department: updated.department,
    employeeCode: updated.employeeCode,
    isActive: updated.isActive,
    message: 'Empleado actualizado exitosamente',
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getUserWithContext(userId: string): Promise<UserContext | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      globalRole: { select: { name: true } },
    },
  })
}
