import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../../config/api'
import { Modal } from '../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../shared/components/ui/forms/Button'
import { useToast } from '../../../shared/hooks/useToast'
import { AffiliateForm } from '../../affiliates/components/AffiliateForm'
import { useAvailableOwners } from '../../affiliates/hooks/useAffiliateLookups'
import { useAddAffiliateToPolicy } from '../hooks/usePolicyMutations'
import type { AddAffiliateToPolicyRequest } from '../policies'
import {
  addAffiliateToPolicySchema,
  type AddAffiliateToPolicyFormData,
} from '../schemas/addAffiliateToPolicySchema'

interface AddAffiliateToPolicyModalProps {
  isOpen: boolean
  onClose: () => void
  policyId: string
  policyNumber: string
  clientId: string
  clientName: string
}

export function AddAffiliateToPolicyModal({
  isOpen,
  onClose,
  policyId,
  policyNumber,
  clientId,
  clientName,
}: AddAffiliateToPolicyModalProps) {
  const addAffiliateMutation = useAddAffiliateToPolicy()
  const toast = useToast()

  const form = useForm<AddAffiliateToPolicyFormData>({
    resolver: zodResolver(addAffiliateToPolicySchema),
    mode: 'onChange',
    defaultValues: {
      clientId, // Prefill with policy's client
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
      addedAt: '', // Empty means current date/time
    },
  })

  const { handleSubmit, setError, setFocus, reset, watch } = form

  const selectedAffiliateType = watch('affiliateType')

  // Fetch owners when affiliate type is DEPENDENT
  const shouldFetchOwners = selectedAffiliateType === 'DEPENDENT'
  const { data: owners = [] } = useAvailableOwners(
    shouldFetchOwners ? clientId : undefined,
    shouldFetchOwners
  )

  // Client is prefilled and disabled, so we create a single option
  const clientOptions = [{ value: clientId, label: clientName }]

  // Format owners for dropdown
  const ownerOptions = owners.map((owner) => ({
    value: owner.id,
    label: `${owner.firstName} ${owner.lastName}${
      owner.documentNumber ? ` (${owner.documentNumber})` : ''
    }`,
  }))

  const onSubmit = handleSubmit(async (data) => {
    const payload: AddAffiliateToPolicyRequest = {
      clientId: data.clientId,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      affiliateType: data.affiliateType,
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      dateOfBirth: data.dateOfBirth?.trim() || undefined,
      documentType: data.documentType?.trim() || undefined,
      documentNumber: data.documentNumber?.trim() || undefined,
      coverageType: (data.coverageType?.trim() || undefined) as
        | 'T'
        | 'TPLUS1'
        | 'TPLUSF'
        | undefined,
      primaryAffiliateId: data.primaryAffiliateId?.trim() || undefined,
      addedAt: data.addedAt?.trim() || undefined,
    }

    try {
      await addAffiliateMutation.mutateAsync({ policyId, data: payload })
      toast.success('Afiliado agregado a la póliza exitosamente')
      reset()
      onClose()
    } catch (error) {
      // Backend validation errors → map to form fields
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof AddAffiliateToPolicyFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        if (issues[0]) {
          const firstPath = Array.isArray(issues[0].path) ? issues[0].path.join('.') : issues[0].path
          setFocus(firstPath as keyof AddAffiliateToPolicyFormData)
        }
        return // Don't show toast for validation errors
      }

      // Other errors (401, 403, 404, 500)
      const message =
        error instanceof ApiRequestError ? error.message : 'Error al agregar afiliado a la póliza'
      toast.error(message)
    }
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Afiliado a Póliza"
      width="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={addAffiliateMutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="add-affiliate-to-policy-form"
            isLoading={addAffiliateMutation.isPending}
          >
            Agregar a Póliza
          </Button>
        </>
      }
    >
      {/* Show policy context */}
      <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-sm text-gray-600">
          Agregando afiliado a la póliza:{' '}
          <span className="font-medium text-gray-900">{policyNumber}</span>
        </p>
        <p className="text-sm text-gray-600">
          Cliente:{' '}
          <span className="font-medium text-gray-900">{clientName}</span>
        </p>
      </div>

      <FormProvider {...form}>
        <AffiliateForm
          id="add-affiliate-to-policy-form"
          onSubmit={onSubmit}
          mode="add-to-policy"
          clientOptions={clientOptions}
          ownerOptions={ownerOptions}
        />
      </FormProvider>
    </Modal>
  )
}