import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../../config/api'
import type { CreateAffiliateRequest } from '../../../features/affiliates/affiliates'
import {
  useAvailableAffiliateClients,
  useAvailableOwners,
} from '../../../features/affiliates/hooks/useAffiliateLookups'
import { useCreateAffiliate } from '../../../features/affiliates/hooks/useAffiliateMutations'
import { Modal } from '../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../shared/components/ui/forms/Button'
import { useToast } from '../../../shared/hooks/useToast'
import { affiliateFormSchema, type AffiliateFormData } from '../schemas/createAffiliateSchema'

import { AffiliateForm } from './AffiliateForm'

interface CreateAffiliateModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateAffiliateModal({ isOpen, onClose }: CreateAffiliateModalProps) {
  const createMutation = useCreateAffiliate()
  const toast = useToast()

  // Available clients and owners for selects
  const { data: clients = [] } = useAvailableAffiliateClients()

  const form = useForm<AffiliateFormData>({
    resolver: zodResolver(affiliateFormSchema),
    mode: 'onChange',
    defaultValues: {
      clientId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      documentType: '',
      documentNumber: '',
      affiliateType: 'OWNER',
      coverageType: '',
      primaryAffiliateId: '',
    },
  })

  const {
    handleSubmit,
    setError,
    setFocus,
    reset,
    watch,
  } = form

  const selectedClientId = watch('clientId')
  const selectedAffiliateType = watch('affiliateType')

  const shouldFetchOwners = !!selectedClientId && selectedAffiliateType === 'DEPENDENT'
  const { data: owners = [] } = useAvailableOwners(
    shouldFetchOwners ? selectedClientId : undefined,
    shouldFetchOwners
  )

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }))
  const ownerOptions = owners.map((owner) => ({
    value: owner.id,
    label: `${owner.firstName} ${owner.lastName}${
      owner.documentNumber ? ` (${owner.documentNumber})` : ''
    }`,
  }))

  const onSubmit = handleSubmit(async (data) => {
    const payload: CreateAffiliateRequest = {
      clientId: data.clientId,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      dateOfBirth: data.dateOfBirth?.trim() || undefined,
      documentType: data.documentType?.trim() || undefined,
      documentNumber: data.documentNumber?.trim() || undefined,
      affiliateType: data.affiliateType,
      coverageType: (data.coverageType?.trim() || undefined) as
        | 'T'
        | 'TPLUS1'
        | 'TPLUSF'
        | undefined,
      primaryAffiliateId: data.primaryAffiliateId?.trim() || undefined,
    }

    try {
      await createMutation.mutateAsync(payload)
      toast.success('Afiliado creado exitosamente')
      reset()
      onClose()
    } catch (error) {
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof AffiliateFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        if (issues[0]) {
          const firstPath = Array.isArray(issues[0].path) ? issues[0].path.join('.') : issues[0].path
          setFocus(firstPath as keyof AffiliateFormData)
        }
        return // Don't show toast for validation errors
      }

      const message =
        error instanceof ApiRequestError ? error.message : 'Error al crear afiliado'
      toast.error(message)
    }
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Afiliado"
      width="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-affiliate-form"
            isLoading={createMutation.isPending}
          >
            Crear Afiliado
          </Button>
        </>
      }
    >
      <FormProvider {...form}>
        <AffiliateForm
          id="create-affiliate-form"
          onSubmit={onSubmit}
          mode="create"
          clientOptions={clientOptions}
          ownerOptions={ownerOptions}
        />
      </FormProvider>
    </Modal>
  )
}


