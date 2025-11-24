import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../config/api'
import { Modal } from '../../shared/components/ui/feedback/Modal'
import { Button } from '../../shared/components/ui/forms/Button'
import {
  useAvailablePolicyClients,
  useAvailablePolicyInsurers,
} from '../../shared/hooks/policies/usePolicyLookups'
import { useCreatePolicy } from '../../shared/hooks/policies/usePolicyMutations'
import { useToast } from '../../shared/hooks/useToast'

import { policyFormSchema, type PolicyFormData } from './createSchema'
import { PolicyForm } from './PolicyForm'


interface CreatePolicyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreatePolicyModal({ isOpen, onClose }: CreatePolicyModalProps) {
  const createMutation = useCreatePolicy()
  const toast = useToast()

  // Fetch available clients and insurers
  const { data: clients = [] } = useAvailablePolicyClients()
  const { data: insurers = [] } = useAvailablePolicyInsurers()

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }))
  const insurerOptions = insurers.map((i) => ({
    value: i.id,
    label: i.code ? `${i.name} (${i.code})` : i.name,
  }))

  const form = useForm<PolicyFormData>({
    resolver: zodResolver(policyFormSchema),
    mode: 'onChange',
    defaultValues: {
      policyNumber: '',
      type: '',
      clientId: '',
      insurerId: '',
      startDate: '',
      endDate: '',
    },
  })

  const { handleSubmit, setError, setFocus, reset } = form

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createMutation.mutateAsync({
        policyNumber: data.policyNumber,
        clientId: data.clientId,
        insurerId: data.insurerId,
        type: data.type?.trim() || undefined,
        startDate: data.startDate,
        endDate: data.endDate,
      })
      toast.success('Póliza creada exitosamente')
      reset()
      setTimeout(() => onClose(), 500)
    } catch (error) {
      // Backend validation errors → map to form fields
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof PolicyFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        if (issues[0]) {
          const firstPath = Array.isArray(issues[0].path) ? issues[0].path.join('.') : issues[0].path
          setFocus(firstPath as keyof PolicyFormData)
        }
        return
      }

      // Other errors
      const message = error instanceof ApiRequestError ? error.message : 'Error al crear póliza'
      toast.error(message)
    }
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Póliza"
      width="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="create-policy-form" isLoading={createMutation.isPending}>
            Crear Póliza
          </Button>
        </>
      }
    >
      <FormProvider {...form}>
        <PolicyForm
          id="create-policy-form"
          onSubmit={onSubmit}
          mode="create"
          clientOptions={clientOptions}
          insurerOptions={insurerOptions}
        />
      </FormProvider>
    </Modal>
  )
}
