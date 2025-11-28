import { useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { Modal } from '../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../shared/components/ui/forms/Button'
import { DateInput } from '../../../shared/components/ui/forms/DateInput'
import { useToast } from '../../../shared/hooks/useToast'
import { useRemoveAffiliateFromPolicy } from '../hooks/usePolicyMutations'
import type { PolicyAffiliateResponse } from '../policies'

interface RemoveAffiliateFromPolicyModalProps {
  isOpen: boolean
  onClose: () => void
  affiliate: PolicyAffiliateResponse
  policyId: string
  policyNumber: string
}

export function RemoveAffiliateFromPolicyModal({
  isOpen,
  onClose,
  affiliate,
  policyId,
  policyNumber,
}: RemoveAffiliateFromPolicyModalProps) {
  const removeAffiliateMutation = useRemoveAffiliateFromPolicy()
  const toast = useToast()

  // Default to today's date in ISO format
  const today = new Date().toISOString().split('T')[0]
  const [removedAt, setRemovedAt] = useState(today)
  const [error, setError] = useState<string | null>(null)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRemovedAt(e.target.value)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!removedAt) {
      setError('La fecha de baja es requerida')
      return
    }

    try {
      const result = await removeAffiliateMutation.mutateAsync({
        policyId,
        affiliateId: affiliate.id,
        data: { removedAt },
      })

      // Build success message
      let message = `${affiliate.firstName} ${affiliate.lastName} removido de la póliza`
      if (result.cascadedDependents.length > 0) {
        message += ` junto con ${result.cascadedDependents.length} dependiente${result.cascadedDependents.length > 1 ? 's' : ''}`
      }

      toast.success(message)
      onClose()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        // Handle validation errors
        if (err.metadata?.issues) {
          const issues = err.metadata.issues as Array<{ message: string }>
          setError(issues[0]?.message || err.message)
          return
        }
        setError(err.message)
      } else {
        setError('Error al remover afiliado de la póliza')
      }
    }
  }

  const isOwner = affiliate.affiliateType === 'OWNER'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Remover Afiliado de Póliza"
      width="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={removeAffiliateMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            isLoading={removeAffiliateMutation.isPending}
          >
            Remover de Póliza
          </Button>
        </>
      }
    >
      {/* Affiliate and policy context */}
      <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-sm text-gray-600">
          Afiliado:{' '}
          <span className="font-medium text-gray-900">
            {affiliate.firstName} {affiliate.lastName}
          </span>
        </p>
        <p className="text-sm text-gray-600">
          Tipo:{' '}
          <span className="font-medium text-gray-900">
            {isOwner ? 'Titular' : 'Dependiente'}
          </span>
        </p>
        <p className="text-sm text-gray-600">
          Póliza:{' '}
          <span className="font-medium text-gray-900">{policyNumber}</span>
        </p>
      </div>

      {/* Warning for OWNER */}
      {isOwner && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Atención:</strong> Al remover un titular, también se removerán automáticamente
            todos sus dependientes de esta póliza con la misma fecha de baja.
          </p>
        </div>
      )}

      {/* Date input */}
      <div className="space-y-2">
        <DateInput
          id="removedAt"
          name="removedAt"
          label="Fecha de Baja"
          value={removedAt}
          onChange={handleDateChange}
          error={error ? { type: 'manual', message: error } : undefined}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-gray-500">
          La fecha no puede ser futura ni anterior a la fecha de incorporación del afiliado.
        </p>
      </div>
    </Modal>
  )
}
