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
import { CARE_TYPE_LABELS, FIELD_LABELS } from '../claimLifecycle'
import { mapClaimEditFormToUpdateRequest } from '../claimMappers'
import type { AvailablePolicyResponse, ClaimDetailResponse, ClaimUpdateRequest } from '../claims'
import { useAvailableClaimPolicies } from '../hooks/useClaimLookups'
import { useUpdateClaim } from '../hooks/useClaimMutations'
import { useClaimDetail } from '../hooks/useClaims'
import { claimUpdateSchema, type ClaimUpdateFormData } from '../schemas/editClaimSchema'

import { ClaimForm } from './ClaimForm'

/**
 * Helper to convert number to string for form inputs
 */
const numToStr = (val: number | null | undefined): string =>
  val !== null && val !== undefined ? String(val) : ''

/**
 * Convert ClaimDetailResponse to form default values
 * Handles number → string conversion for currency inputs
 */
function getClaimFormValues(claim: ClaimDetailResponse | undefined): ClaimUpdateFormData {
  return {
    // Basic fields
    description: claim?.description || '',
    careType: claim?.careType || '',
    diagnosisCode: claim?.diagnosisCode || '',
    diagnosisDescription: claim?.diagnosisDescription || '',
    policyId: claim?.policyId || '',
    incidentDate: claim?.incidentDate || '',
    submittedDate: claim?.submittedDate || '',
    amountSubmitted: numToStr(claim?.amountSubmitted),
    businessDays: numToStr(claim?.businessDays),
    // Settlement fields
    settlementDate: claim?.settlementDate || '',
    settlementNumber: claim?.settlementNumber || '',
    amountApproved: numToStr(claim?.amountApproved),
    amountDenied: numToStr(claim?.amountDenied),
    amountUnprocessed: numToStr(claim?.amountUnprocessed),
    deductibleApplied: numToStr(claim?.deductibleApplied),
    copayApplied: numToStr(claim?.copayApplied),
    settlementNotes: claim?.settlementNotes || '',
  }
}

interface EditClaimModalProps {
  isOpen: boolean
  onClose: () => void
  claimId: string | null
}

/**
 * Edit claim modal with two-step confirmation flow
 *
 * Flow:
 * 1. User edits form fields
 * 2. Click "Revisar Cambios" → Shows diff of changes
 * 3. User confirms → Saves to API
 *
 * Features:
 * - Uses ClaimForm (DateInput, CurrencyInput, etc.)
 * - Smart diff calculation (formats values for comparison)
 * - Server error mapping to form fields
 * - Two-step confirmation (prevents accidental saves)
 *
 * @example
 * <EditClaimModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   claimId={claim.id}
 * />
 */
export function EditClaimModal({ isOpen, onClose, claimId }: EditClaimModalProps) {
  const { data: claim, isLoading: isLoadingData } = useClaimDetail(claimId || '')
  const updateMutation = useUpdateClaim()
  const toast = useToast()

  // Fetch available policies for this claim
  const { data: availablePolicies = [] } = useAvailableClaimPolicies(claimId || '', isOpen)

  const policyOptions = availablePolicies.map((p: AvailablePolicyResponse) => ({
    value: p.id,
    label: `${p.policyNumber} - ${p.insurerName}`,
  }))

  const [pendingData, setPendingData] = useState<ClaimUpdateRequest | null>(null)
  const [changes, setChanges] = useState<ChangeRecord[]>([])
  const [isConfirmOpen, setConfirmOpen] = useState(false)

  const form = useForm<ClaimUpdateFormData>({
    resolver: zodResolver(claimUpdateSchema),
    mode: 'onChange',
    defaultValues: getClaimFormValues(claim),
  })

  const {
    handleSubmit,
    setError,
    reset,
    formState: { dirtyFields },
  } = form

  // Reset form when claim loads or modal reopens
  useEffect(() => {
    if (claim && isOpen) {
      reset(getClaimFormValues(claim))
    }
    if (!isOpen) {
      setPendingData(null)
      setChanges([])
      setConfirmOpen(false)
    }
  }, [claim, isOpen, reset])

  // Step 1: Calculate diffs
  const onSaveClick = handleSubmit((formData) => {
    if (!claim) return

    const diffs: ChangeRecord[] = []

    // Policy lookup helper
    const getPolicyLabel = (policyId: string) => {
      const policy = availablePolicies.find((p: AvailablePolicyResponse) => p.id === policyId)
      return policy?.policyNumber
    }

    // CareType lookup helper
    const getCareTypeLabel = (value: string | null | undefined) => {
      if (!value) return null
      return CARE_TYPE_LABELS[value as keyof typeof CARE_TYPE_LABELS] || value
    }

    // Check each dirty field for changes
    Object.keys(dirtyFields).forEach((key) => {
      const oldValue = claim[key as keyof typeof claim]
      const newValue = formData[key as keyof typeof formData]

      if (oldValue !== newValue) {
        // Special formatting for careType
        if (key === 'careType') {
          diffs.push({
            field: key,
            label: FIELD_LABELS[key as keyof typeof FIELD_LABELS] || key,
            oldValue: getCareTypeLabel(oldValue as string | null) ?? '—',
            newValue: getCareTypeLabel(newValue as string | null | undefined) ?? '—',
          })
        } else {
          diffs.push({
            field: key,
            label: FIELD_LABELS[key as keyof typeof FIELD_LABELS] || key,
            oldValue: formatFieldValue(key, oldValue, getPolicyLabel),
            newValue: formatFieldValue(key, newValue, getPolicyLabel),
          })
        }
      }
    })

    if (diffs.length === 0) {
      toast.info('No hay cambios para guardar')
      return
    }

    // Map form data to API DTO (strings → numbers, etc.)
    const updatePayload = mapClaimEditFormToUpdateRequest(formData, dirtyFields)

    setPendingData(updatePayload)
    setChanges(diffs)
    setConfirmOpen(true)
  })

  // Step 2: Confirmed save
  const handleConfirm = async () => {
    if (!claimId || !pendingData) return

    try {
      await updateMutation.mutateAsync({
        id: claimId,
        data: pendingData,
      })
      toast.success('Reclamo actualizado exitosamente')
      setConfirmOpen(false)
      onClose()
    } catch (error) {
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        setConfirmOpen(false)
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof ClaimUpdateFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        return
      }

      const message = error instanceof ApiRequestError ? error.message : 'Error al actualizar reclamo'
      toast.error(message)
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen && !isConfirmOpen}
        onClose={onClose}
        title="Editar Reclamo"
        width="xl"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form="edit-claim-form" disabled={isLoadingData}>
              Revisar Cambios
            </Button>
          </>
        }
      >
        {isLoadingData || !claim ? (
          <div className="h-40 animate-pulse bg-gray-100 rounded-xl" />
        ) : (
          <FormProvider {...form}>
            <ClaimForm
              id="edit-claim-form"
              onSubmit={onSaveClick}
              policyOptions={policyOptions}
              clientName={claim.clientName}
              affiliateName={`${claim.affiliateFirstName} ${claim.affiliateLastName}`}
              patientName={`${claim.patientFirstName} ${claim.patientLastName}`}
              patientRelationship={claim.patientRelationship}
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
