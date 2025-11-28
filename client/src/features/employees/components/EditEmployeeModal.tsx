import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../../config/api'
import {
  ConfirmationModal,
  type ChangeRecord,
} from '../../../shared/components/ui/feedback/ConfirmationModal'
import { Modal } from '../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../shared/components/ui/forms/Button'
import { useToast } from '../../../shared/hooks/useToast'
import { formatFieldValue } from '../../../shared/utils/formatters'
import { getEmployeeFormValues, mapEmployeeEditFormToUpdateRequest } from '../employeeMappers'
import type { UpdateEmployeeRequest } from '../employees'
import { useUpdateEmployee } from '../hooks/useEmployeeMutations'
import { useEmployeeDetail } from '../hooks/useEmployees'
import { updateEmployeeSchema, type EmployeeUpdateFormData } from '../schemas/updateEmployeeSchema'

import { EmployeeForm } from './EmployeeForm'

interface EditEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  employeeId: string | null
}

// Field labels for diff display
const FIELD_LABELS: Record<string, string> = {
  firstName: 'Nombre',
  lastName: 'Apellido',
  phone: 'Teléfono',
  position: 'Cargo',
  department: 'Departamento',
  employeeCode: 'Código de Empleado',
  isActive: 'Estado',
}

export function EditEmployeeModal({
  isOpen,
  onClose,
  employeeId,
}: EditEmployeeModalProps) {
  const { data: employee, isLoading: isLoadingData } = useEmployeeDetail(employeeId || '')
  const updateMutation = useUpdateEmployee()
  const toast = useToast()

  const [pendingData, setPendingData] = useState<UpdateEmployeeRequest | null>(null)
  const [changes, setChanges] = useState<ChangeRecord[]>([])
  const [isConfirmOpen, setConfirmOpen] = useState(false)

  const form = useForm<EmployeeUpdateFormData>({
    resolver: zodResolver(updateEmployeeSchema),
    mode: 'onChange',
    defaultValues: getEmployeeFormValues(employee),
  })

  const {
    handleSubmit,
    setError,
    reset,
    formState: { dirtyFields },
  } = form

  // Reset form when employee loads or modal closes
  useEffect(() => {
    if (employee && isOpen) {
      reset(getEmployeeFormValues(employee))
    }
    if (!isOpen) {
      setPendingData(null)
      setChanges([])
      setConfirmOpen(false)
    }
  }, [employee, isOpen, reset])

  // Step 1: Calculate diffs and prepare payload
  const onSaveClick = handleSubmit((formData) => {
    if (!employee) return

    // Calculate diffs using formatFieldValue for consistency
    const diffs: ChangeRecord[] = Object.keys(dirtyFields)
      .filter((key) => dirtyFields[key as keyof typeof dirtyFields])
      .map((key) => {
        const fieldKey = key as keyof EmployeeUpdateFormData
        const oldValue: unknown = employee[fieldKey as keyof typeof employee]
        const newValue: unknown = formData[fieldKey]

        return {
          field: key,
          label: FIELD_LABELS[key] || key,
          oldValue: formatFieldValue(key, oldValue),
          newValue: formatFieldValue(key, newValue),
        }
      })
      .filter((diff) => diff.oldValue !== diff.newValue) // Only include actual changes

    if (diffs.length === 0) {
      toast.info('No hay cambios para guardar')
      return
    }

    const updatePayload = mapEmployeeEditFormToUpdateRequest(
      formData,
      dirtyFields as Record<string, boolean | undefined>
    )

    setPendingData(updatePayload)
    setChanges(diffs)
    setConfirmOpen(true)
  })

  // Step 2: Confirm save and send to API
  const handleConfirm = async () => {
    if (!employeeId || !pendingData) return

    try {
      await updateMutation.mutateAsync({
        id: employeeId,
        data: pendingData,
      })
      toast.success('Empleado actualizado exitosamente')
      setConfirmOpen(false)
      onClose()
    } catch (error) {
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        setConfirmOpen(false)
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof EmployeeUpdateFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        return
      }

      const message =
        error instanceof ApiRequestError ? error.message : 'Error al actualizar empleado'
      toast.error(message)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <Modal
        isOpen={isOpen && !isConfirmOpen}
        onClose={onClose}
        title="Editar Empleado"
        width="lg"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form="edit-employee-form" disabled={isLoadingData}>
              Revisar Cambios
            </Button>
          </>
        }
      >
        {isLoadingData || !employee ? (
          <div className="h-40 animate-pulse bg-gray-100 rounded-xl" />
        ) : (
          <FormProvider {...form}>
            <EmployeeForm
              id="edit-employee-form"
              onSubmit={onSaveClick}
            />
          </FormProvider>
        )}
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        changes={changes}
        isLoading={updateMutation.isPending}
      />
    </>
  )
}
