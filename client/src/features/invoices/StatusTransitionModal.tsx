import { useEffect, useMemo, useRef } from 'react'

import { Modal } from '../../shared/components/ui/feedback/Modal'
import { Button } from '../../shared/components/ui/forms/Button'
import {
  FIELD_LABELS,
  INVOICE_LIFECYCLE,
  isFieldPresent,
} from '../../shared/constants/invoiceLifecycle'
import { useUpdateInvoice } from '../../shared/hooks/invoices/useInvoiceMutations'
import { useToast } from '../../shared/hooks/useToast'
import type { InvoiceDetailResponse, InvoiceStatus } from '../../shared/types/invoices'

interface StatusTransitionModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: InvoiceDetailResponse
  targetStatus: InvoiceStatus
}

export function StatusTransitionModal({
  isOpen,
  onClose,
  invoice,
  targetStatus,
}: StatusTransitionModalProps) {
  const updateMutation = useUpdateInvoice()
  const toast = useToast()

  // Freeze the status we are transitioning FROM
  const originStatusRef = useRef<InvoiceStatus>(invoice.status)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    // Capture origin status only on the transition from closed → open
    if (isOpen && !wasOpenRef.current) {
      originStatusRef.current = invoice.status
      wasOpenRef.current = true
    }
    if (!isOpen) {
      wasOpenRef.current = false
    }
  }, [isOpen, invoice.status])

  const currentConfig = INVOICE_LIFECYCLE[originStatusRef.current]
  const targetConfig = INVOICE_LIFECYCLE[targetStatus]

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
      isFilled: isFieldPresent(invoice[field as keyof InvoiceDetailResponse]),
    }))
  }, [invoice, requirements])

  const filledCount = requirementStatus.filter((r) => r.isFilled).length
  const allRequirementsMet = filledCount === requirements.length

  const handleConfirm = async () => {
    try {
      await updateMutation.mutateAsync({
        id: invoice.id,
        data: { status: targetStatus },
      })
      toast.success(`Factura cambiada a ${targetConfig.label}`)
      setTimeout(() => onClose(), 500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cambiar estado de factura'
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
              allRequirementsMet ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
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

          {/* Warning for CANCELLED (terminal state) */}
          {targetStatus === 'CANCELLED' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-900">
                <strong>⚠️ Advertencia:</strong> Esta acción es irreversible. Las facturas canceladas
                no pueden ser reactivadas.
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          ¿Está seguro de cambiar el estado de esta factura a {targetConfig.label}?
        </p>
      )}
    </Modal>
  )
}
