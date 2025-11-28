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
import { useUpdateInsurer } from '../hooks/useInsurerMutations'
import { useInsurerDetail } from '../hooks/useInsurers'
import { getInsurerFormValues, mapInsurerEditFormToUpdateRequest } from '../insurerMappers'
import type { UpdateInsurerRequest } from '../insurers'
import { updateInsurerSchema, type InsurerUpdateFormData } from '../schemas/updateInsurerSchema'

import { InsurerForm } from './InsurerForm'

interface EditInsurerModalProps {
  isOpen: boolean
  onClose: () => void
  insurerId: string | null
}

// Field labels for diff display
const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  code: 'Código',
  email: 'Correo Electrónico',
  phone: 'Teléfono',
  website: 'Sitio Web',
  isActive: 'Estado',
}

export function EditInsurerModal({
  isOpen,
  onClose,
  insurerId,
}: EditInsurerModalProps) {
  const { data: insurer, isLoading: isLoadingData } = useInsurerDetail(insurerId || '')
  const updateMutation = useUpdateInsurer()
  const toast = useToast()

  const [pendingData, setPendingData] = useState<UpdateInsurerRequest | null>(null)
  const [changes, setChanges] = useState<ChangeRecord[]>([])
  const [isConfirmOpen, setConfirmOpen] = useState(false)

  const form = useForm<InsurerUpdateFormData>({
    resolver: zodResolver(updateInsurerSchema),
    mode: 'onChange',
    defaultValues: getInsurerFormValues(insurer),
  })

  const {
    handleSubmit,
    setError,
    reset,
    formState: { dirtyFields },
  } = form

  // Reset form when insurer loads or modal closes
  useEffect(() => {
    if (insurer && isOpen) {
      reset(getInsurerFormValues(insurer))
    }
    if (!isOpen) {
      setPendingData(null)
      setChanges([])
      setConfirmOpen(false)
    }
  }, [insurer, isOpen, reset])

  // Step 1: Calculate diffs and prepare payload
  const onSaveClick = handleSubmit((formData) => {
    if (!insurer) return

    // Calculate diffs using formatFieldValue for consistency
    const diffs: ChangeRecord[] = Object.keys(dirtyFields)
      .filter((key) => dirtyFields[key as keyof typeof dirtyFields])
      .map((key) => {
        const fieldKey = key as keyof InsurerUpdateFormData
        let oldValue: unknown = insurer[fieldKey as keyof typeof insurer]
        let newValue: unknown = formData[fieldKey]

        // Special handling for boolean fields
        if (key === 'isActive') {
          oldValue = oldValue ? 'Activo' : 'Inactivo'
          newValue = newValue ? 'Activo' : 'Inactivo'
        }

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

    const updatePayload = mapInsurerEditFormToUpdateRequest(
      formData,
      dirtyFields as Record<string, boolean | undefined>
    )

    setPendingData(updatePayload)
    setChanges(diffs)
    setConfirmOpen(true)
  })

  // Step 2: Confirm save and send to API
  const handleConfirm = async () => {
    if (!insurerId || !pendingData) return

    try {
      await updateMutation.mutateAsync({
        id: insurerId,
        data: pendingData,
      })
      toast.success('Aseguradora actualizada exitosamente')
      setConfirmOpen(false)
      onClose()
    } catch (error) {
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        setConfirmOpen(false)
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof InsurerUpdateFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        return
      }

      const message =
        error instanceof ApiRequestError ? error.message : 'Error al actualizar aseguradora'
      toast.error(message)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <Modal
        isOpen={isOpen && !isConfirmOpen}
        onClose={onClose}
        title="Editar Aseguradora"
        width="lg"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form="edit-insurer-form" disabled={isLoadingData}>
              Revisar Cambios
            </Button>
          </>
        }
      >
        {isLoadingData || !insurer ? (
          <div className="h-40 animate-pulse bg-gray-100 rounded-xl" />
        ) : (
          <FormProvider {...form}>
            <InsurerForm
              id="edit-insurer-form"
              onSubmit={onSaveClick}
              mode="edit"
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
