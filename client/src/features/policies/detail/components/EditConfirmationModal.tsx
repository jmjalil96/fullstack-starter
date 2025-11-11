/**
 * EditConfirmationModal - Confirmation modal showing field changes before save
 * Displays diff of old vs new values for policy fields
 */

import { Dialog } from '@headlessui/react'

import { Button } from '../../../../shared/components/ui/Button'
import { FIELD_LABELS } from '../../../../shared/constants/policyLifecycle'

/**
 * Single field change for diff display
 */
export interface FieldChange {
  /** Field key */
  field: keyof typeof FIELD_LABELS
  /** Original value */
  oldValue: unknown
  /** New value */
  newValue: unknown
}

/**
 * Props for EditConfirmationModal component
 */
interface EditConfirmationModalProps {
  /** Modal open state */
  isOpen: boolean
  /** Close modal callback */
  onClose: () => void
  /** Array of changed fields to display */
  changes: FieldChange[]
  /** Callback to confirm save (triggers API call) */
  onConfirm: () => void
  /** Loading state during API call */
  loading?: boolean
}

/**
 * Format value for diff display
 * Handles dates, currency, percentages, and booleans specifically for policy fields
 */
const formatValue = (field: keyof typeof FIELD_LABELS, val: unknown): string => {
  if (val === null || val === undefined) return '—'

  // Copays as percentages
  if (field === 'ambCopay' || field === 'hospCopay') {
    return typeof val === 'number' ? `${val}%` : String(val)
  }

  // Tax rate as decimal -> percentage
  if (field === 'taxRate') {
    return typeof val === 'number' ? `${(val * 100).toFixed(2)}%` : String(val)
  }

  // Currency fields (premiums, additionalCosts, maternity)
  if (
    field === 'tPremium' ||
    field === 'tplus1Premium' ||
    field === 'tplusfPremium' ||
    field === 'additionalCosts' ||
    field === 'maternity'
  ) {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD',
      }).format(val)
    }
    return String(val)
  }

  // Date fields
  if (field === 'startDate' || field === 'endDate') {
    if (typeof val === 'string') {
      const d = new Date(val)
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })
      }
    }
  }

  // String fallback (policyNumber, type, clientId, insurerId)
  return String(val)
}

/**
 * EditConfirmationModal - Show changes before saving
 *
 * Features:
 * - Diff display (old → new)
 * - Empty state (no changes guard)
 * - Headless UI Dialog (accessible, ESC/backdrop close)
 * - Safe value formatting (dates, currency, percentages, booleans)
 * - Loading state during save
 * - Uses FIELD_LABELS from policyLifecycle for Spanish labels
 *
 * @example
 * <EditConfirmationModal
 *   isOpen={confirmOpen}
 *   onClose={() => setConfirmOpen(false)}
 *   changes={[
 *     { field: 'tPremium', oldValue: 100, newValue: 150 }
 *   ]}
 *   onConfirm={handleSave}
 *   loading={saving}
 * />
 */
export function EditConfirmationModal({
  isOpen,
  onClose,
  changes,
  onConfirm,
  loading = false,
}: EditConfirmationModalProps) {
  const hasChanges = changes.length > 0

  return (
    <Dialog open={isOpen} onClose={onClose}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" aria-hidden="true" />

      {/* Panel Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6">
          {/* Header */}
          <Dialog.Title className="text-xl font-bold text-[var(--color-navy)] mb-3">
            ¿Confirmar cambios?
          </Dialog.Title>

          {/* Context Box */}
          <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
            <p className="text-sm text-gray-700">
              {hasChanges
                ? `Los siguientes ${changes.length} ${changes.length === 1 ? 'campo será modificado' : 'campos serán modificados'}:`
                : 'No hay cambios para guardar'}
            </p>
          </div>

          {/* Changes as Field Cards in 2-Column Grid */}
          {hasChanges ? (
            <div className="grid md:grid-cols-2 gap-3 mb-4">
              {changes.map((change) => (
                <div key={change.field} className="border border-blue-200 bg-blue-50 rounded p-2.5">
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    {FIELD_LABELS[change.field]}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatValue(change.field, change.oldValue)}
                  </div>
                  <div className="text-center text-gray-400 text-xs my-0.5">↓</div>
                  <div className="text-sm text-teal-700 font-medium">
                    {formatValue(change.field, change.newValue)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
              <p className="text-sm text-gray-600 text-center italic">No hay cambios para guardar</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <Button
              variant="primary"
              onClick={onConfirm}
              loading={loading}
              disabled={!hasChanges || loading}
              className="flex-1"
            >
              Confirmar Cambios
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
