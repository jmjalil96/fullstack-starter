import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../../config/api'
import type { ClientDetailResponse } from '../../../features/clients/clients'
import { useUpdateClient } from '../../../features/clients/hooks/useClientMutations'
import { useClientDetail } from '../../../features/clients/hooks/useClients'
import {
  ConfirmationModal,
  type ChangeRecord,
} from '../../../shared/components/ui/feedback/ConfirmationModal'
import { Modal } from '../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../shared/components/ui/forms/Button'
import { useToast } from '../../../shared/hooks/useToast'
import { formatFieldValue } from '../../../shared/utils/formatters'
import { getClientFormValues, mapClientEditFormToUpdateRequest } from '../clientMappers'
import { clientUpdateSchema, type ClientUpdateFormData } from '../schemas/clientUpdateSchema'

import { ClientForm } from './ClientForm'

interface EditClientModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string | null
}

// Field labels for change display
const FIELD_LABELS: Record<string, string> = {
  name: 'Razón Social',
  taxId: 'RUC / DNI',
  email: 'Email Corporativo',
  phone: 'Teléfono',
  address: 'Dirección Fiscal',
  isActive: 'Estado',
}

/**
 * Edit client modal with two-step confirmation flow
 *
 * Flow:
 * 1. User edits form fields
 * 2. Click "Revisar Cambios" → Shows diff of changes
 * 3. User confirms → Saves to API
 *
 * Features:
 * - Uses ClientForm (Input, Textarea, Checkbox)
 * - Smart diff calculation (formats values for comparison)
 * - Mapper for type conversion and dirty field tracking
 * - Server error mapping to form fields
 */
export function EditClientModal({ isOpen, onClose, clientId }: EditClientModalProps) {
  const { data: client, isLoading: isLoadingData } = useClientDetail(clientId || '')
  const updateMutation = useUpdateClient()
  const toast = useToast()

  const [pendingData, setPendingData] = useState<ClientUpdateFormData | null>(null)
  const [changes, setChanges] = useState<ChangeRecord[]>([])
  const [isConfirmOpen, setConfirmOpen] = useState(false)

  const form = useForm<ClientUpdateFormData>({
    resolver: zodResolver(clientUpdateSchema),
    mode: 'onChange',
    defaultValues: getClientFormValues(client),
  })

  const {
    handleSubmit,
    setError,
    reset,
    formState: { dirtyFields },
  } = form

  // Reset form when client data loads or modal closes
  useEffect(() => {
    if (client && isOpen) {
      reset(getClientFormValues(client))
    }
    if (!isOpen) {
      setPendingData(null)
      setChanges([])
      setConfirmOpen(false)
    }
  }, [client, isOpen, reset])

  // Step 1: Calculate diffs
  const onSaveClick = handleSubmit((formData) => {
    if (!client) return

    // Calculate diffs using formatFieldValue
    const diffs: ChangeRecord[] = Object.keys(dirtyFields)
      .filter((key) => {
        const oldValue = client[key as keyof ClientDetailResponse]
        const newValue = formData[key as keyof ClientUpdateFormData]
        return oldValue !== newValue
      })
      .map((key) => ({
        field: key,
        label: FIELD_LABELS[key as keyof typeof FIELD_LABELS] || key,
        oldValue: formatFieldValue(
          key,
          client[key as keyof ClientDetailResponse]
        ),
        newValue: formatFieldValue(
          key,
          formData[key as keyof ClientUpdateFormData]
        ),
      }))

    if (diffs.length === 0) {
      toast.info('No hay cambios para guardar')
      return
    }

    // Map form data to API DTO
    const updatePayload = mapClientEditFormToUpdateRequest(formData, dirtyFields)

    setPendingData(updatePayload)
    setChanges(diffs)
    setConfirmOpen(true)
  })

  // Step 2: Confirmed save
  const handleConfirm = async () => {
    if (!clientId || !pendingData) return

    try {
      await updateMutation.mutateAsync({
        id: clientId,
        data: pendingData,
      })
      toast.success('Cliente actualizado exitosamente')
      setConfirmOpen(false)
      onClose()
    } catch (error) {
      // Backend validation errors
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        setConfirmOpen(false)
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof ClientUpdateFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        return
      }

      // Other errors
      const message = error instanceof ApiRequestError ? error.message : 'Error al actualizar cliente'
      toast.error(message)
    }
  }

  return (
    <>
      {/* Main Edit Form Modal */}
      <Modal
        isOpen={isOpen && !isConfirmOpen}
        onClose={onClose}
        title="Editar Cliente"
        width="lg"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form="edit-client-form" disabled={isLoadingData}>
              Revisar Cambios
            </Button>
          </>
        }
      >
        {isLoadingData || !client ? (
          <div className="h-40 animate-pulse bg-gray-100 rounded-xl" />
        ) : (
          <FormProvider {...form}>
            <ClientForm id="edit-client-form" onSubmit={onSaveClick} mode="edit" />
          </FormProvider>
        )}
      </Modal>

      {/* Confirmation Modal */}
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
