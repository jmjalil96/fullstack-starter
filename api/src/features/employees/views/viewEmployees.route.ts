/**
 * viewEmployees.route.ts
 * Route for viewing and listing employees
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import { employeeIdParamSchema, type EmployeeIdParam } from './employeeDetail.schema.js'
import { getEmployeeById } from './employeeDetail.service.js'
import { getEmployeesQuerySchema, type GetEmployeesQuery } from './viewEmployees.schema.js'
import { getEmployees } from './viewEmployees.service.js'

const router = Router()

/**
 * GET /api/employees
 * Get paginated list of employees
 *
 * Authorization: BROKER_EMPLOYEES only
 */
router.get(
  '/employees',
  requireAuth,
  validateRequest({ query: getEmployeesQuerySchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }

    const query = req.query as unknown as GetEmployeesQuery
    const response = await getEmployees(user.id, query)

    res.status(200).json(response)
  })
)

/**
 * GET /api/employees/:id
 * Get complete employee detail by ID
 *
 * Authorization: BROKER_EMPLOYEES only
 */
router.get(
  '/employees/:id',
  requireAuth,
  validateRequest({ params: employeeIdParamSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }

    const { id } = req.params as EmployeeIdParam
    const employee = await getEmployeeById(user.id, id)

    res.status(200).json(employee)
  })
)

export default router
