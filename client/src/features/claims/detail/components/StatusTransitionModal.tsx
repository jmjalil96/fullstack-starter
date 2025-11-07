/**
 * StatusTransitionModal - Confirmation modal for status changes
 * Shows requirements checklist before transitioning
 */

import { Dialog } from '@headlessui/react'

import { Button } from '../../../../shared/components/ui/Button'
import { CLAIM_LIFECYCLE, FIELD_LABELS, isFieldPresent } from '../../../../shared/constants/claimLifecycle'
import type { ClaimDetailResponse, ClaimStatus } from '../../../../shared/types/claims'

/**
 * Props for StatusTransitionModal component
 */
interface StatusTransitionModalProps {
  /** Modal open state */
  isOpen: boolean
  /** Close modal callback */
  onClose: () => void
  /** Current claim data */
  claim: ClaimDetailResponse
  /** Target status to transition to */
  targetStatus: ClaimStatus
  /** Callback to confirm transition (triggers API call) */
  onConfirm: () => void
  /** Loading state during API call */
  loading?: boolean
}

/**
 * StatusTransitionModal - Confirm status change with requirements validation
 *
 * Features:
 * - Requirements checklist (✓ met, ✗ missing)
 * - Shows current values for met requirements
 * - Disables confirm if requirements not met
 * - Headless UI Dialog (accessible, ESC/backdrop close)
 * - Blueprint-driven requirements
 *
 * @example
 * <StatusTransitionModal
 *   isOpen={statusModalOpen}
 *   onClose={() => setStatusModalOpen(false)}
 *   claim={claim}
 *   targetStatus="APPROVED"
 *   onConfirm={handleApprove}
 *   loading={updating}
 * />
 */
export function StatusTransitionModal({
  isOpen,
  onClose,
  claim,
  targetStatus,
  onConfirm,
  loading = false,
}: StatusTransitionModalProps) {
  // Get current status config and transition info
  const current = CLAIM_LIFECYCLE[claim.status]
  const transition = current.transitions.find((t) => t.status === targetStatus)
  const requirements = current.requirements

  // Check if all requirements are met
  const allRequirementsMet = requirements.every((f) =>
    isFieldPresent(claim[f as keyof ClaimDetailResponse])
  )

  /**
   * Format value for inline display in requirements list
   * Handles dates, numbers, and strings safely
   */
  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return '—'

    // Try date parsing
    if (typeof val === 'string') {
      const d = new Date(val)
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })
      }
    }

    // Format numbers
    if (typeof val === 'number') {
      return new Intl.NumberFormat('es-ES', { style: 'decimal' }).format(val)
    }

    // String fallback
    return String(val)
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" aria-hidden="true" />

      {/* Panel Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <Dialog.Title className="text-xl font-bold text-[var(--color-navy)] mb-4">
            ¿Cambiar estado a {CLAIM_LIFECYCLE[targetStatus].label.toUpperCase()}?
          </Dialog.Title>

          {/* Requirements Checklist */}
          <div className="mb-6">
            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Requisitos:</p>
            <ul className="space-y-2 text-sm">
              {requirements.map((field) => {
                const value = claim[field as keyof ClaimDetailResponse]
                const isMet = isFieldPresent(value)

                return (
                  <li key={field} className={isMet ? 'text-green-600' : 'text-red-600'}>
                    <span className="font-medium">{isMet ? '✓' : '✗'}</span>{' '}
                    {FIELD_LABELS[field as keyof typeof FIELD_LABELS]}
                    {isMet && value && (
                      <span className="ml-2 text-gray-600">: {formatValue(value)}</span>
                    )}
                  </li>
                )
              })}
            </ul>

            {/* Warning if requirements not met */}
            {!allRequirementsMet && (
              <p className="mt-3 text-sm text-red-600 italic">
                Complete los campos faltantes antes de continuar
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant={transition?.variant ?? 'primary'}
              onClick={onConfirm}
              disabled={loading || !allRequirementsMet || !transition}
              loading={loading}
              className="flex-1"
            >
              Confirmar {transition?.label ?? 'Cambio'}
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
              Cancelar
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
