import { useEffect, useMemo, useRef } from 'react'

import { Modal } from '../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../shared/components/ui/forms/Button'
import { useToast } from '../../../shared/hooks/useToast'
import { useUpdatePolicy } from '../hooks/usePolicyMutations'
import type { PolicyDetailResponse, PolicyStatus } from '../policies'
import { FIELD_LABELS, POLICY_LIFECYCLE } from '../policyLifecycle'

interface StatusTransitionModalProps {
  isOpen: boolean
  onClose: () => void
  policy: PolicyDetailResponse
  targetStatus: PolicyStatus
}

// Helper: Check if field is filled
const isFieldPresent = (value: unknown): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && value.trim() === '') return false
  return true
}

export function StatusTransitionModal({
  isOpen,
  onClose,
  policy,
  targetStatus,
}: StatusTransitionModalProps) {
  const updateMutation = useUpdatePolicy()
  const toast = useToast()

  // Freeze the status we are transitioning FROM
  const originStatusRef = useRef<PolicyStatus>(policy.status)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    // Capture origin status only on the transition from closed → open
    if (isOpen && !wasOpenRef.current) {
      originStatusRef.current = policy.status
      wasOpenRef.current = true
    }
    if (!isOpen) {
      wasOpenRef.current = false
    }
  }, [isOpen, policy.status])

  const currentConfig = POLICY_LIFECYCLE[originStatusRef.current]
  const targetConfig = POLICY_LIFECYCLE[targetStatus]

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
      isFilled: isFieldPresent(policy[field as keyof PolicyDetailResponse]),
    }))
  }, [policy, requirements])

  const filledCount = requirementStatus.filter((r) => r.isFilled).length
  const allRequirementsMet = filledCount === requirements.length

  const handleConfirm = async () => {
    try {
      await updateMutation.mutateAsync({
        id: policy.id,
        data: { status: targetStatus },
      })
      toast.success(`Póliza cambiada a ${targetConfig.label}`)
      setTimeout(() => onClose(), 500)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al cambiar estado de póliza'
      toast.error(message)
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
                ? `✓ Todos los requisitos completados (${filledCount}/${requirements.length})`
                : `⚠️ Requisitos: ${filledCount} de ${requirements.length} completados`}
            </p>
          </div>

          {/* Requirements List */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Campos Requeridos
            </p>
            <div className="space-y-2">
              {requirementStatus.map((req) => (
                <div key={req.field} className="flex items-center gap-2 text-sm">
                  {req.isFilled ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                  <span className={req.isFilled ? 'text-gray-700' : 'text-red-600 font-medium'}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning for activation */}
          {targetStatus === 'ACTIVE' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>⚠️ Importante:</strong> Una vez activa, solo usuarios SUPER_ADMIN podrán editar
                esta póliza. Verifique que todos los datos sean correctos.
              </p>
            </div>
          )}

          {/* Warning for cancellation */}
          {targetStatus === 'CANCELLED' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-900">
                <strong>⚠️ Advertencia:</strong> Esta acción es irreversible. Las pólizas canceladas no
                pueden ser reactivadas.
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          ¿Está seguro de cambiar el estado de esta póliza a {targetConfig.label}?
        </p>
      )}
    </Modal>
  )
}
