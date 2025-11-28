import { useState } from 'react'

import { Modal } from '../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../shared/components/ui/forms/Button'
import { useToast } from '../../../shared/hooks/useToast'
import { formatCurrency } from '../../../shared/utils/formatters'
import { useValidateInvoice } from '../hooks/useInvoiceMutations'
import type { InvoiceDetailResponse, ValidateInvoiceResponse } from '../invoices'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ValidateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: InvoiceDetailResponse
}

interface AffiliateAdjustment {
  affiliateId: string
  affiliateName: string
  type: 'JOINED' | 'LEFT' | 'JOINED_AND_LEFT' | 'TIER_CHANGED'
  activityDate: string
  coverageDays: number
  amount: number
  tier: string
  oldTier?: string
  newTier?: string
}

interface BillingBreakdown {
  base: { count: number; amount: number }
  adjustments: AffiliateAdjustment[]
  adjustmentsTotal: number
  total: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ADJUSTMENT_TYPE_CONFIG: Record<
  AffiliateAdjustment['type'],
  { label: string; icon: string; color: string }
> = {
  JOINED: { label: 'Alta', icon: '+', color: 'text-green-600' },
  LEFT: { label: 'Baja', icon: '-', color: 'text-red-600' },
  JOINED_AND_LEFT: { label: 'Alta/Baja', icon: '±', color: 'text-amber-600' },
  TIER_CHANGED: { label: 'Cambio Tier', icon: '↔', color: 'text-blue-600' },
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ValidateInvoiceModal({ isOpen, onClose, invoice }: ValidateInvoiceModalProps) {
  const validateMutation = useValidateInvoice()
  const toast = useToast()
  const [validationResult, setValidationResult] = useState<ValidateInvoiceResponse | null>(null)

  const handleConfirm = async () => {
    try {
      const result = await validateMutation.mutateAsync(invoice.id)
      setValidationResult(result)
      // Don't close - show results instead
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al validar factura'
      toast.error(message)
    }
  }

  const handleClose = () => {
    setValidationResult(null)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={validationResult ? 'Resultado de Validación' : 'Validar Factura'}
      width={validationResult ? 'lg' : 'md'}
      footer={
        validationResult ? (
          <Button onClick={handleClose}>Entendido</Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleClose} disabled={validateMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} isLoading={validateMutation.isPending}>
              Validar Factura
            </Button>
          </>
        )
      }
    >
      {validationResult ? (
        <ValidationResultContent result={validationResult} />
      ) : (
        <ValidationConfirmContent />
      )}
    </Modal>
  )
}

// ============================================================================
// CONFIRMATION CONTENT (Before validation)
// ============================================================================

function ValidationConfirmContent() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        La validación calculará automáticamente los montos y conteos esperados basándose en las
        pólizas asociadas y el período de facturación.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-900">
          <strong>Nota:</strong> El estado de la factura permanecerá como{' '}
          <span className="font-medium">Pendiente</span> después de la validación. Podrás revisar
          los resultados y cambiar el estado manualmente.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-600">
          Se actualizarán: Monto Esperado, Conteo Esperado, y el desglose por póliza.
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// RESULT CONTENT (After validation)
// ============================================================================

function ValidationResultContent({ result }: { result: ValidateInvoiceResponse }) {
  // Aggregate adjustments from all policies
  const allAdjustments = result.policies.flatMap((p) => {
    const breakdown = p.expectedBreakdown as unknown as BillingBreakdown | null
    return breakdown?.adjustments || []
  })
  const adjustmentsTotal = allAdjustments.reduce((sum, adj) => sum + adj.amount, 0)

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Monto Esperado
            </p>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(result.expectedAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Afiliados Base
            </p>
            <p className="text-2xl font-bold text-blue-900">{result.expectedAffiliateCount}</p>
          </div>
        </div>
      </div>

      {/* Adjustments Section */}
      {allAdjustments.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Ajustes del Período ({allAdjustments.length})
            </p>
            <p
              className={`text-sm font-bold ${adjustmentsTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {adjustmentsTotal >= 0 ? '+' : ''}
              {formatCurrency(adjustmentsTotal)}
            </p>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {allAdjustments.map((adj, idx) => (
              <AdjustmentRow key={`${adj.affiliateId}-${idx}`} adjustment={adj} />
            ))}
          </div>
        </div>
      )}

      {/* No Adjustments Message */}
      {allAdjustments.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500 text-center">
            No hay ajustes para este período de facturación.
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-sm text-amber-900">
          <strong>Nota:</strong> El estado permanece <strong>PENDIENTE</strong>. Revise los valores
          calculados y proceda a validar o marcar discrepancia.
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// ADJUSTMENT ROW COMPONENT
// ============================================================================

function AdjustmentRow({ adjustment }: { adjustment: AffiliateAdjustment }) {
  const config = ADJUSTMENT_TYPE_CONFIG[adjustment.type]

  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`font-bold ${config.color} flex-shrink-0`}>{config.icon}</span>
        <span className="text-gray-700 truncate">{adjustment.affiliateName}</span>
        <span className="text-xs text-gray-400 flex-shrink-0">({config.label})</span>
      </div>
      <span
        className={`font-medium flex-shrink-0 ml-2 ${adjustment.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}
      >
        {adjustment.amount >= 0 ? '+' : ''}
        {formatCurrency(adjustment.amount)}
      </span>
    </div>
  )
}
