import { useEffect, useMemo, useRef, useState } from 'react'

import { Modal } from '../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../shared/components/ui/forms/Button'
import { DateInput } from '../../../shared/components/ui/forms/DateInput'
import { Input } from '../../../shared/components/ui/forms/Input'
import { useToast } from '../../../shared/hooks/useToast'
import { CLAIM_LIFECYCLE, FIELD_LABELS, isFieldPresent, isTerminalState } from '../claimLifecycle'
import type { ClaimDetailResponse, ClaimStatus, ClaimUpdateRequest } from '../claims'
import { useUpdateClaim } from '../hooks/useClaimMutations'

interface StatusTransitionModalProps {
  isOpen: boolean
  onClose: () => void
  claim: ClaimDetailResponse
  targetStatus: ClaimStatus
}

/**
 * Status transition modal with lifecycle-driven validation
 *
 * Features:
 * - Validates required fields before allowing transition
 * - Shows visual checklist of requirements
 * - Freezes origin status to prevent race conditions
 * - Warns about irreversible terminal states
 * - Uses CLAIM_LIFECYCLE for all validation rules
 * - Collects reprocess data for PENDING_INFO → SUBMITTED transition
 *
 * @example
 * <StatusTransitionModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   claim={claim}
 *   targetStatus="VALIDATION"
 * />
 */
export function StatusTransitionModal({
  isOpen,
  onClose,
  claim,
  targetStatus,
}: StatusTransitionModalProps) {
  const updateMutation = useUpdateClaim()
  const toast = useToast()

  // Reprocess form state (only used for PENDING_INFO → SUBMITTED)
  const [reprocessDate, setReprocessDate] = useState('')
  const [reprocessDescription, setReprocessDescription] = useState('')

  // Freeze the status we are transitioning FROM
  // Prevents requirements from changing if claim.status updates while modal is open
  const originStatusRef = useRef<ClaimStatus>(claim.status)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    // Capture origin status only on the transition from closed → open
    if (isOpen && !wasOpenRef.current) {
      originStatusRef.current = claim.status
      wasOpenRef.current = true
    }
    if (!isOpen) {
      wasOpenRef.current = false
      // Reset reprocess fields when modal closes
      setReprocessDate('')
      setReprocessDescription('')
    }
  }, [isOpen, claim.status])

  const originStatus = originStatusRef.current
  const currentConfig = CLAIM_LIFECYCLE[originStatus]
  const targetConfig = CLAIM_LIFECYCLE[targetStatus]

  // Check if this is the PENDING_INFO → SUBMITTED transition (requires reprocess data)
  const isReprocessTransition = originStatus === 'PENDING_INFO' && targetStatus === 'SUBMITTED'

  // Check if target is a terminal state (no further transitions allowed)
  const isTerminalStatus = isTerminalState(targetStatus)

  // Requirements depend on ORIGIN status AND TARGET status (per-transition requirements)
  const requirements = useMemo((): readonly string[] => {
    const transReqs = currentConfig.transitionRequirements as Record<ClaimStatus, readonly string[]> | undefined
    return transReqs?.[targetStatus] || []
  }, [currentConfig.transitionRequirements, targetStatus])

  // Check which requirements are met
  const requirementStatus = useMemo(() => {
    return requirements.map((field) => ({
      field,
      label: FIELD_LABELS[field as keyof typeof FIELD_LABELS] || field,
      isFilled: isFieldPresent(claim[field as keyof ClaimDetailResponse]),
    }))
  }, [claim, requirements])

  const filledCount = requirementStatus.filter((r) => r.isFilled).length
  const allRequirementsMet = filledCount === requirements.length

  // Validate reprocess form (only needed for PENDING_INFO → SUBMITTED)
  const isReprocessValid = isReprocessTransition
    ? reprocessDate.trim() !== '' && reprocessDescription.trim().length >= 3
    : true

  // Can submit only when all requirements are met AND reprocess form is valid (if applicable)
  const canSubmit = allRequirementsMet && isReprocessValid

  // Dynamic modal width - larger for reprocess form
  const modalWidth = isReprocessTransition ? 'lg' : 'md'

  const handleConfirm = async () => {
    try {
      // Build request data
      const data: ClaimUpdateRequest = { status: targetStatus }

      // Include reprocess fields for PENDING_INFO → SUBMITTED
      if (isReprocessTransition) {
        data.reprocessDate = reprocessDate
        data.reprocessDescription = reprocessDescription
      }

      await updateMutation.mutateAsync({
        id: claim.id,
        data,
      })
      toast.success(`Reclamo cambiado a ${targetConfig.label}`)
      onClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al cambiar estado de reclamo'
      toast.error(message)
      onClose() // Close modal, let user see error in detail page
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`¿Cambiar a ${targetConfig.label}?`}
      width={modalWidth}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canSubmit}
            isLoading={updateMutation.isPending}
          >
            Confirmar Cambio
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Reprocess Form (only for PENDING_INFO → SUBMITTED) */}
        {isReprocessTransition && (
          <div className="space-y-4 bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Información de Reproceso
            </p>
            <div className="grid grid-cols-2 gap-4">
              <DateInput
                label="Fecha de Reproceso"
                value={reprocessDate}
                onChange={(e) => setReprocessDate(e.target.value)}
                variant="light"
              />
              <Input
                label="Descripción del Reproceso"
                value={reprocessDescription}
                onChange={(e) => setReprocessDescription(e.target.value)}
                variant="light"
                placeholder="Descripción del motivo de reproceso..."
              />
            </div>
            {!isReprocessValid && reprocessDescription.length > 0 && reprocessDescription.length < 3 && (
              <p className="text-xs text-red-600">
                La descripción debe tener al menos 3 caracteres
              </p>
            )}
          </div>
        )}

        {/* Requirements Section (if any) */}
        {requirements.length > 0 && (
          <>
            {/* Progress Summary */}
            <div
              className={`rounded-lg p-3 border ${
                allRequirementsMet
                  ? 'bg-green-50 border-green-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  allRequirementsMet ? 'text-green-900' : 'text-amber-900'
                }`}
              >
                {allRequirementsMet
                  ? `Todos los requisitos completados (${filledCount}/${requirements.length})`
                  : `Requisitos: ${filledCount} de ${requirements.length} completados`}
              </p>
              {!allRequirementsMet && (
                <p className="text-xs text-amber-700 mt-1">
                  Complete los campos faltantes en el formulario de edición antes de continuar.
                </p>
              )}
            </div>

            {/* Requirements List */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Campos Requeridos
              </p>
              <ul className="space-y-2 list-none">
                {requirementStatus.map((req) => (
                  <li key={req.field} className="flex items-center gap-2 text-sm">
                    {req.isFilled ? (
                      <span className="text-green-600" aria-hidden="true">
                        ✓
                      </span>
                    ) : (
                      <span className="text-red-500" aria-hidden="true">
                        ✗
                      </span>
                    )}
                    <span className={req.isFilled ? 'text-gray-700' : 'text-red-600 font-medium'}>
                      {req.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Simple confirmation message when no requirements and no reprocess form */}
        {requirements.length === 0 && !isReprocessTransition && (
          <p className="text-sm text-gray-600">
            ¿Está seguro de cambiar el estado de este reclamo a {targetConfig.label}?
          </p>
        )}

        {/* Warning for Terminal States */}
        {isTerminalStatus && (
          <div
            className={`rounded-lg p-3 border ${
              targetStatus === 'SETTLED'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <p
              className={`text-sm ${
                targetStatus === 'SETTLED' ? 'text-green-900' : 'text-red-900'
              }`}
            >
              <strong>Advertencia:</strong> Esta acción es irreversible. Los reclamos en estado{' '}
              <strong>{targetConfig.label}</strong> no pueden ser modificados ni reactivados
              posteriormente.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
