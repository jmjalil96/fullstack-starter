import { Modal } from '../../shared/components/ui/feedback/Modal'
import { Button } from '../../shared/components/ui/forms/Button'
import { useValidateInvoice } from '../../shared/hooks/invoices/useInvoiceMutations'
import { useToast } from '../../shared/hooks/useToast'
import type { InvoiceDetailResponse } from '../../shared/types/invoices'

interface ValidateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: InvoiceDetailResponse
}

export function ValidateInvoiceModal({ isOpen, onClose, invoice }: ValidateInvoiceModalProps) {
  const validateMutation = useValidateInvoice()
  const toast = useToast()

  const handleConfirm = async () => {
    try {
      await validateMutation.mutateAsync(invoice.id)
      toast.success('Factura validada exitosamente')
      setTimeout(() => onClose(), 500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al validar factura'
      toast.error(message)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Validar Factura"
      width="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={validateMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} isLoading={validateMutation.isPending}>
            Validar Factura
          </Button>
        </>
      }
    >
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
    </Modal>
  )
}
