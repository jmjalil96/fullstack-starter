import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../config/api'
import {
  ConfirmationModal,
  type ChangeRecord,
} from '../../shared/components/ui/feedback/ConfirmationModal'
import { Modal } from '../../shared/components/ui/feedback/Modal'
import { Button } from '../../shared/components/ui/forms/Button'
import { FIELD_LABELS } from '../../shared/constants/policyLifecycle'
import { usePolicyDetail } from '../../shared/hooks/policies/usePolicies'
import {
  useAvailablePolicyClients,
  useAvailablePolicyInsurers,
} from '../../shared/hooks/policies/usePolicyLookups'
import { useUpdatePolicy } from '../../shared/hooks/policies/usePolicyMutations'
import { useToast } from '../../shared/hooks/useToast'
import type { PolicyDetailResponse, UpdatePolicyRequest } from '../../shared/types/policies'
import { formatFieldValue } from '../../shared/utils/formatters'

import { policyUpdateSchema, type PolicyEditFormData } from './editSchema'
import { getPolicyFormValues, mapPolicyEditFormToUpdateRequest } from './mappers'
import { PolicyForm } from './PolicyForm'

interface EditPolicyModalProps {
  isOpen: boolean
  onClose: () => void
  policyId: string | null
}

export function EditPolicyModal({ isOpen, onClose, policyId }: EditPolicyModalProps) {
  const { data: policy, isLoading: isLoadingData } = usePolicyDetail(policyId || '')
  const updateMutation = useUpdatePolicy()
  const toast = useToast()

  // Fetch available clients and insurers
  const { data: clients = [] } = useAvailablePolicyClients()
  const { data: insurers = [] } = useAvailablePolicyInsurers()

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }))
  const insurerOptions = insurers.map((i) => ({
    value: i.id,
    label: i.code ? `${i.name} (${i.code})` : i.name,
  }))

  const [pendingData, setPendingData] = useState<UpdatePolicyRequest | null>(null)
  const [changes, setChanges] = useState<ChangeRecord[]>([])
  const [isConfirmOpen, setConfirmOpen] = useState(false)

  const form = useForm<PolicyEditFormData>({
    resolver: zodResolver(policyUpdateSchema),
    mode: 'onChange',
    defaultValues: getPolicyFormValues(policy),
  })

  const {
    handleSubmit,
    setError,
    reset,
    formState: { dirtyFields },
  } = form

  // Reset form when policy loads
  useEffect(() => {
    if (policy && isOpen) {
      reset(getPolicyFormValues(policy))
    }
    if (!isOpen) {
      setPendingData(null)
      setChanges([])
      setConfirmOpen(false)
    }
  }, [policy, isOpen, reset])

  // Step 1: Calculate diffs
  const onSaveClick = handleSubmit((formData) => {
    if (!policy) return

    // Calculate diffs using formatFieldValue
    const diffs: ChangeRecord[] = Object.keys(dirtyFields)
      .filter((key) => {
        const oldValue = policy[key as keyof PolicyDetailResponse]
        const newValue = formData[key as keyof PolicyEditFormData]
        return oldValue !== newValue
      })
      .map((key) => ({
        field: key,
        label: FIELD_LABELS[key as keyof typeof FIELD_LABELS] || key,
        oldValue: formatFieldValue(key, policy[key as keyof PolicyDetailResponse]),
        newValue: formatFieldValue(key, formData[key as keyof PolicyEditFormData]),
      }))

    if (diffs.length === 0) {
      toast.info('No hay cambios para guardar')
      return
    }

    // Map form data to API DTO (strings → numbers, etc.)
    const updatePayload = mapPolicyEditFormToUpdateRequest(formData, dirtyFields)

    setPendingData(updatePayload)
    setChanges(diffs)
    setConfirmOpen(true)
  })

  // Step 2: Confirmed save
  const handleConfirm = async () => {
    if (!policyId || !pendingData) return

    try {
      await updateMutation.mutateAsync({
        id: policyId,
        data: pendingData,
      })
      toast.success('Póliza actualizada exitosamente')
      setConfirmOpen(false)
      onClose()
    } catch (error) {
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        setConfirmOpen(false)
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof PolicyEditFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        return
      }

      const message = error instanceof ApiRequestError ? error.message : 'Error al actualizar póliza'
      toast.error(message)
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen && !isConfirmOpen}
        onClose={onClose}
        title="Editar Póliza"
        width="xl"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form="edit-policy-form" disabled={isLoadingData}>
              Revisar Cambios
            </Button>
          </>
        }
      >
        {isLoadingData || !policy ? (
          <div className="h-40 animate-pulse bg-gray-100 rounded-xl" />
        ) : (
          <FormProvider {...form}>
            <PolicyForm
              id="edit-policy-form"
              onSubmit={onSaveClick}
              mode="edit"
              clientOptions={clientOptions}
              insurerOptions={insurerOptions}
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
