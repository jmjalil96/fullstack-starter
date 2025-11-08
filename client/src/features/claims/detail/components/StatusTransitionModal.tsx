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
        <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6">
          {/* Header with Icon */}
          <Dialog.Title className="text-xl font-bold text-[var(--color-navy)] mb-3">
            {transition?.icon} ¿Cambiar estado a {CLAIM_LIFECYCLE[targetStatus].label.toUpperCase()}?
          </Dialog.Title>

          {/* Context Box */}
          <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
            <p className="text-sm text-gray-700">
              Requisitos ({requirements.filter((f) => isFieldPresent(claim[f as keyof ClaimDetailResponse])).length} de{' '}
              {requirements.length} completados)
            </p>
          </div>

          {/* Requirements as 2-Column Grid */}
          <div className="mb-4">
            <div className="grid md:grid-cols-2 gap-3">
              {requirements.map((field) => {
                const value = claim[field as keyof ClaimDetailResponse]
                const isMet = isFieldPresent(value)

                return (
                  <div
                    key={field}
                    className={`border rounded p-2.5 ${
                      isMet ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-600 mb-0.5">
                      {FIELD_LABELS[field as keyof typeof FIELD_LABELS]}
                    </div>
                    <div className={`text-sm ${isMet ? 'text-green-700 font-medium' : 'text-red-600'}`}>
                      {isMet ? `✓ ${formatValue(value)}` : '✗ Sin completar'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Status Banner if Requirements Not Met */}
          {!allRequirementsMet && (
            <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-4">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ Faltan {requirements.length - requirements.filter((f) => isFieldPresent(claim[f as keyof ClaimDetailResponse])).length} campos para continuar
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <Button
              variant={transition?.variant ?? 'primary'}
              onClick={onConfirm}
              disabled={loading || !allRequirementsMet || !transition}
              loading={loading}
              className="flex-1"
            >
              {allRequirementsMet ? `Confirmar ${transition?.label ?? 'Cambio'}` : 'Complete los campos faltantes'}
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
