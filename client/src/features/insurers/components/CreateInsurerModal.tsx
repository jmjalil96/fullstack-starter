import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../../config/api'
import { Modal } from '../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../shared/components/ui/forms/Button'
import { useToast } from '../../../shared/hooks/useToast'
import { useCreateInsurer } from '../hooks/useInsurerMutations'
import { getInsurerCreateFormDefaults, mapInsurerCreateFormToRequest } from '../insurerMappers'
import { createInsurerSchema, type InsurerCreateFormData } from '../schemas/createInsurerSchema'

import { InsurerForm } from './InsurerForm'

interface CreateInsurerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateInsurerModal({ isOpen, onClose }: CreateInsurerModalProps) {
  const createMutation = useCreateInsurer()
  const toast = useToast()

  const form = useForm<InsurerCreateFormData>({
    resolver: zodResolver(createInsurerSchema),
    mode: 'onChange',
    defaultValues: getInsurerCreateFormDefaults(),
  })

  const { handleSubmit, setError, reset } = form

  const handleClose = () => {
    reset(getInsurerCreateFormDefaults())
    onClose()
  }

  const onSubmit = handleSubmit(async (formData) => {
    try {
      const payload = mapInsurerCreateFormToRequest(formData)
      await createMutation.mutateAsync(payload)
      toast.success('Aseguradora creada exitosamente')
      handleClose()
    } catch (error) {
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof InsurerCreateFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        return
      }

      const message =
        error instanceof ApiRequestError ? error.message : 'Error al crear aseguradora'
      toast.error(message)
    }
  })

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Crear Aseguradora"
      width="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-insurer-form"
            isLoading={createMutation.isPending}
          >
            Crear Aseguradora
          </Button>
        </>
      }
    >
      <FormProvider {...form}>
        <InsurerForm
          id="create-insurer-form"
          onSubmit={onSubmit}
          mode="create"
        />
      </FormProvider>
    </Modal>
  )
}
