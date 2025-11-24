import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../../config/api'
import type { UpdateAffiliateRequest } from '../../../features/affiliates/affiliates'
import { useAvailableOwners } from '../../../features/affiliates/hooks/useAffiliateLookups'
import { useUpdateAffiliate } from '../../../features/affiliates/hooks/useAffiliateMutations'
import { useAffiliateDetail } from '../../../features/affiliates/hooks/useAffiliates'
import {
  ConfirmationModal,
  type ChangeRecord,
} from '../../../shared/components/ui/feedback/ConfirmationModal'
import { Modal } from '../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../shared/components/ui/forms/Button'
import { useToast } from '../../../shared/hooks/useToast'
import { formatFieldValue } from '../../../shared/utils/formatters'
import { getAffiliateFormValues, mapAffiliateEditFormToUpdateRequest } from '../affiliateMappers'
import { affiliateUpdateSchema, type AffiliateUpdateFormData } from '../schemas/updateAffiliateSchema'

import { AffiliateForm } from './AffiliateForm'

interface EditAffiliateModalProps {
  isOpen: boolean
  onClose: () => void
  affiliateId: string | null
}

// Field labels for diff display
const FIELD_LABELS: Record<string, string> = {
  firstName: 'Nombre',
  lastName: 'Apellido',
  email: 'Correo Electrónico',
  phone: 'Teléfono',
  dateOfBirth: 'Fecha de Nacimiento',
  documentType: 'Tipo de Documento',
  documentNumber: 'Número de Documento',
  affiliateType: 'Tipo de Afiliado',
  coverageType: 'Tipo de Cobertura',
  primaryAffiliateId: 'Afiliado Principal',
  isActive: 'Estado',
}

export function EditAffiliateModal({
  isOpen,
  onClose,
  affiliateId,
}: EditAffiliateModalProps) {
  const { data: affiliate, isLoading: isLoadingData } = useAffiliateDetail(affiliateId || '')
  const updateMutation = useUpdateAffiliate()
  const toast = useToast()

  const [pendingData, setPendingData] = useState<UpdateAffiliateRequest | null>(null)
  const [changes, setChanges] = useState<ChangeRecord[]>([])
  const [isConfirmOpen, setConfirmOpen] = useState(false)

  const form = useForm<AffiliateUpdateFormData>({
    resolver: zodResolver(affiliateUpdateSchema),
    mode: 'onChange',
    defaultValues: getAffiliateFormValues(affiliate),
  })

  const {
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { dirtyFields },
  } = form

  const watchedAffiliateType = watch('affiliateType')

  // Owners list only when DEPENDENT (clientId is immutable)
  const shouldFetchOwners = watchedAffiliateType === 'DEPENDENT' && !!affiliate?.clientId
  const { data: owners = [] } = useAvailableOwners(
    shouldFetchOwners ? affiliate.clientId : undefined,
    shouldFetchOwners
  )

  // Reset form when affiliate loads or modal closes
  useEffect(() => {
    if (affiliate && isOpen) {
      reset(getAffiliateFormValues(affiliate))
    }
    if (!isOpen) {
      setPendingData(null)
      setChanges([])
      setConfirmOpen(false)
    }
  }, [affiliate, isOpen, reset])

  const clientOptions =
    affiliate != null
      ? [{ value: affiliate.clientId, label: affiliate.clientName }]
      : []

  const ownerOptions = owners.map((owner) => ({
    value: owner.id,
    label: `${owner.firstName} ${owner.lastName}${
      owner.documentNumber ? ` (${owner.documentNumber})` : ''
    }`,
  }))

  // Step 1: Calculate diffs and prepare payload
  const onSaveClick = handleSubmit((formData) => {
    if (!affiliate) return

    // Calculate diffs using formatFieldValue for consistency
    const diffs: ChangeRecord[] = Object.keys(dirtyFields)
      .filter((key) => dirtyFields[key as keyof typeof dirtyFields])
      .map((key) => {
        const fieldKey = key as keyof AffiliateUpdateFormData
        let oldValue: unknown = affiliate[fieldKey as keyof typeof affiliate]
        let newValue: unknown = formData[fieldKey]

        // Special handling for primaryAffiliateId display (show name instead of ID)
        if (key === 'primaryAffiliateId') {
          if (oldValue && affiliate.primaryAffiliateFirstName) {
            oldValue = `${affiliate.primaryAffiliateFirstName} ${affiliate.primaryAffiliateLastName}`.trim()
          }
          if (newValue) {
            const owner = owners.find(o => o.id === newValue)
            if (owner) {
              newValue = `${owner.firstName} ${owner.lastName}`.trim()
            }
          }
        }

        // Special handling for boolean fields
        if (key === 'isActive') {
          oldValue = oldValue ? 'Activo' : 'Inactivo'
          newValue = newValue ? 'Activo' : 'Inactivo'
        }

        // Special handling for affiliateType
        if (key === 'affiliateType') {
          oldValue = oldValue === 'OWNER' ? 'Titular' : 'Dependiente'
          newValue = newValue === 'OWNER' ? 'Titular' : 'Dependiente'
        }

        // Special handling for coverageType
        if (key === 'coverageType') {
          const coverageMap: Record<string, string> = {
            'T': 'T - Titular',
            'TPLUS1': 'T+1 - Titular + 1',
            'TPLUSF': 'T+F - Titular + Familia'
          }
          if (oldValue && typeof oldValue === 'string') {
            oldValue = coverageMap[oldValue] || oldValue
          }
          if (newValue && typeof newValue === 'string') {
            newValue = coverageMap[newValue] || newValue
          }
        }

        return {
          field: key,
          label: FIELD_LABELS[key] || key,
          oldValue: formatFieldValue(key, oldValue),
          newValue: formatFieldValue(key, newValue),
        }
      })
      .filter(diff => diff.oldValue !== diff.newValue) // Only include actual changes

    if (diffs.length === 0) {
      toast.info('No hay cambios para guardar')
      return
    }

    const updatePayload = mapAffiliateEditFormToUpdateRequest(
      formData,
      dirtyFields as Record<string, boolean | undefined>
    )

    setPendingData(updatePayload)
    setChanges(diffs)
    setConfirmOpen(true)
  })

  // Step 2: Confirm save and send to API
  const handleConfirm = async () => {
    if (!affiliateId || !pendingData) return

    try {
      await updateMutation.mutateAsync({
        id: affiliateId,
        data: pendingData,
      })
      toast.success('Afiliado actualizado exitosamente')
      setConfirmOpen(false)
      onClose()
    } catch (error) {
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        setConfirmOpen(false)
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof AffiliateUpdateFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        return // Don't show toast for validation errors
      }

      const message =
        error instanceof ApiRequestError ? error.message : 'Error al actualizar afiliado'
      toast.error(message)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <Modal
        isOpen={isOpen && !isConfirmOpen}
        onClose={onClose}
        title="Editar Afiliado"
        width="xl"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form="edit-affiliate-form" disabled={isLoadingData}>
              Revisar Cambios
            </Button>
          </>
        }
      >
        {isLoadingData || !affiliate ? (
          <div className="h-40 animate-pulse bg-gray-100 rounded-xl" />
        ) : (
          <FormProvider {...form}>
            <AffiliateForm
              id="edit-affiliate-form"
              onSubmit={onSaveClick}
              mode="edit"
              clientOptions={clientOptions}
              ownerOptions={ownerOptions}
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


