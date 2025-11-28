/**
 * editEmployee.route.ts
 * Route for editing employees
 */

import { Router } from 'express'

import { UnauthorizedError } from '../../../shared/errors/errors.js'
import { asyncHandler } from '../../../shared/middleware/asyncHandler.js'
import { requireAuth } from '../../../shared/middleware/requireAuth.js'
import { validateRequest } from '../../../shared/middleware/validation.js'

import {
  editEmployeeSchema,
  employeeIdParamSchema,
  type EditEmployeeInput,
  type EmployeeIdParam,
} from './editEmployee.schema.js'
import { editEmployee } from './editEmployee.service.js'

const router = Router()

/**
 * PATCH /api/employees/:id
 * Edit an employee's information
 *
 * Authorization: BROKER_EMPLOYEES only
 */
router.patch(
  '/employees/:id',
  requireAuth,
  validateRequest({ params: employeeIdParamSchema, body: editEmployeeSchema }),
  asyncHandler(async (req, res) => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError('User not authenticated')
    }

    const { id } = req.params as EmployeeIdParam
    const data = req.body as EditEmployeeInput

    const response = await editEmployee(user.id, id, data)

    res.status(200).json(response)
  })
)

export default router
