import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../../config/api'
import { useCreateClient } from '../../../features/clients/hooks/useClientMutations'
import { Modal } from '../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../shared/components/ui/forms/Button'
import { useToast } from '../../../shared/hooks/useToast'
import { clientFormSchema, type ClientFormData } from '../schemas/clientCreateSchema'

import { ClientForm } from './ClientForm'


interface CreateClientModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateClientModal({ isOpen, onClose }: CreateClientModalProps) {
  const createMutation = useCreateClient()
  const toast = useToast()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
    },
  })

  const { handleSubmit, setError, setFocus, reset } = form

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        taxId: data.taxId,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
      })
      toast.success('Cliente creado exitosamente')
      reset()
      onClose()
    } catch (error) {
      // Backend validation errors → map to form fields
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof ClientFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        if (issues[0]) {
          const firstPath = Array.isArray(issues[0].path) ? issues[0].path.join('.') : issues[0].path
          setFocus(firstPath as keyof ClientFormData)
        }
        return // Don't show toast for validation errors
      }

      // Other errors (401, 403, 409, 500)
      const message =
        error instanceof ApiRequestError ? error.message : 'Error al crear cliente'
      toast.error(message)
    }
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Cliente"
      width="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-client-form"
            isLoading={createMutation.isPending}
          >
            Crear Cliente
          </Button>
        </>
      }
    >
      <FormProvider {...form}>
        <ClientForm id="create-client-form" onSubmit={onSubmit} mode="create" />
      </FormProvider>
    </Modal>
  )
}
