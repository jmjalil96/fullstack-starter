import { useEffect, useMemo, useRef } from 'react'

import { Modal } from '../../shared/components/ui/feedback/Modal'
import { Button } from '../../shared/components/ui/forms/Button'
import { CLAIM_LIFECYCLE, FIELD_LABELS, isFieldPresent } from '../../shared/constants/claimLifecycle'
import { useUpdateClaim } from '../../shared/hooks/claims/useClaimMutations'
import { useToast } from '../../shared/hooks/useToast'
import type { ClaimDetailResponse, ClaimStatus } from '../../shared/types/claims'

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
 *
 * @example
 * <StatusTransitionModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   claim={claim}
 *   targetStatus="UNDER_REVIEW"
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
    }
  }, [isOpen, claim.status])

  const currentConfig = CLAIM_LIFECYCLE[originStatusRef.current]
  const targetConfig = CLAIM_LIFECYCLE[targetStatus]

  // Check if target is a terminal state (no further transitions allowed)
  const isTerminalStatus = targetConfig.transitions.length === 0

  // Requirements come from ORIGIN status (frozen, won't change)
  const requirements = useMemo(
    () => currentConfig.requirements || [],
    [currentConfig.requirements]
  )

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

  const handleConfirm = async () => {
    try {
      await updateMutation.mutateAsync({
        id: claim.id,
        data: { status: targetStatus },
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
      width="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!allRequirementsMet}
            isLoading={updateMutation.isPending}
          >
            Confirmar Cambio
          </Button>
        </>
      }
    >
      {requirements.length > 0 ? (
        <div className="space-y-4">
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

          {/* Warning for Terminal States */}
          {isTerminalStatus && (
            <div
              className={`rounded-lg p-3 border ${
                targetStatus === 'APPROVED'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <p
                className={`text-sm ${
                  targetStatus === 'APPROVED' ? 'text-green-900' : 'text-red-900'
                }`}
              >
                <strong>⚠️ Advertencia:</strong> Esta acción es irreversible. Los reclamos en estado{' '}
                <strong>{targetConfig.label}</strong> no pueden ser modificados ni reactivados
                posteriormente.
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          ¿Está seguro de cambiar el estado de este reclamo a {targetConfig.label}?
        </p>
      )}
    </Modal>
  )
}
