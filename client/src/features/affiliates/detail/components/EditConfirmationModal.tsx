/**
 * EditConfirmationModal - Confirmation modal showing field changes before save
 * Displays diff of old vs new values for affiliate data
 */

import { Dialog } from '@headlessui/react'

import { Button } from '../../../../shared/components/ui/Button'

/**
 * Single field change for diff display
 */
export interface FieldChange {
  /** Field key */
  field: string
  /** Field label (Spanish) */
  label: string
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
 * Handles booleans, dates, numbers, and strings safely
 */
const formatValue = (val: unknown): string => {
  if (val === null || val === undefined) return '—'

  // Format booleans (isActive field)
  if (typeof val === 'boolean') {
    return val ? 'Activo' : 'Inactivo'
  }

  // Try date parsing (only for ISO date strings)
  if (typeof val === 'string') {
    // Only parse if it looks like an ISO date (YYYY-MM-DD or has T for datetime)
    if (val.match(/^\d{4}-\d{2}-\d{2}/) || val.includes('T')) {
      const d = new Date(val)
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })
      }
    }
  }

  // Format numbers
  if (typeof val === 'number') {
    return new Intl.NumberFormat('es-ES', { style: 'decimal' }).format(val)
  }

  // String fallback
  return String(val)
}

/**
 * EditConfirmationModal - Show changes before saving affiliate data
 *
 * Features:
 * - Diff display (old → new)
 * - Empty state (no changes guard)
 * - Headless UI Dialog (accessible, ESC/backdrop close)
 * - Safe value formatting (dates, numbers)
 * - Loading state during save
 *
 * @example
 * <EditConfirmationModal
 *   isOpen={confirmOpen}
 *   onClose={() => setConfirmOpen(false)}
 *   changes={[
 *     { field: 'name', label: 'Nombre', oldValue: 'old', newValue: 'new' }
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
            Confirmar Cambios
          </Dialog.Title>

          {/* Context Box */}
          <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
            <p className="text-sm text-gray-700">
              {hasChanges ? `${changes.length} campos modificados` : 'No hay cambios para guardar'}
            </p>
          </div>

          {/* Changes as Field Cards in 2-Column Grid */}
          {hasChanges ? (
            <div className="grid md:grid-cols-2 gap-3 mb-4">
              {changes.map((change) => (
                <div key={change.field} className="border border-blue-200 bg-blue-50 rounded p-2.5">
                  <div className="text-xs font-medium text-gray-600 mb-1">{change.label}</div>
                  <div className="text-sm text-gray-600">{formatValue(change.oldValue)}</div>
                  <div className="text-center text-gray-400 text-xs my-0.5">↓</div>
                  <div className="text-sm text-teal-700 font-medium">{formatValue(change.newValue)}</div>
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
