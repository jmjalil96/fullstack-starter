/**
 * viewEmployees.service.ts
 * Service for viewing and listing employees
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { Prisma } from '@prisma/client'

import { db } from '../../../config/database.js'
import { BROKER_EMPLOYEES } from '../../../shared/constants/roles.js'
import {
  ForbiddenError,
  UnauthorizedError,
} from '../../../shared/errors/errors.js'
import { logger } from '../../../shared/middleware/logger.js'

import type {
  EmployeeListItemResponse,
  GetEmployeesQueryParams,
  GetEmployeesResponse,
  PaginationMetadata,
} from './viewEmployees.dto.js'

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
 * Get employees based on query filters
 *
 * Authorization:
 * - Only BROKER_EMPLOYEES can view employees
 */
export async function getEmployees(
  userId: string,
  query: GetEmployeesQueryParams
): Promise<GetEmployeesResponse> {
  // STEP 1: Load User Context
  const user = await getUserWithContext(userId)

  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado')
  }

  // STEP 2: Role Authorization Check
  const roleName = user.globalRole?.name

  if (!roleName || !BROKER_EMPLOYEES.includes(roleName as never)) {
    logger.warn({ userId, role: roleName }, 'Unauthorized employees list access attempt')
    throw new ForbiddenError('No tienes permiso para ver empleados')
  }

  // STEP 3: Build WHERE Clause
  const where: Prisma.EmployeeWhereInput = {}

  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { employeeCode: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  if (query.department) {
    where.department = { contains: query.department, mode: 'insensitive' }
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive
  }

  // STEP 4: Pagination
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const skip = (page - 1) * limit

  // STEP 5: Execute Queries
  const [employees, total] = await Promise.all([
    db.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
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
      },
    }),
    db.employee.count({ where }),
  ])

  // STEP 6: Transform
  const transformed: EmployeeListItemResponse[] = employees.map((e) => ({
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    phone: e.phone,
    position: e.position,
    department: e.department,
    employeeCode: e.employeeCode,
    userId: e.userId,
    hasUserAccount: e.userId !== null,
    isActive: e.isActive,
    createdAt: e.createdAt.toISOString(),
  }))

  // STEP 7: Pagination Metadata
  const totalPages = Math.ceil(total / limit)
  const pagination: PaginationMetadata = {
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  }

  logger.info({ userId, resultCount: transformed.length, total }, 'Employees retrieved')

  return { employees: transformed, pagination }
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
