/**
 * EditConfirmationModal - Confirmation modal showing field changes before save
 * Displays diff of old vs new values
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

/**
 * EditConfirmationModal - Show changes before saving
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
 *     { field: 'description', label: 'Descripción', oldValue: 'old', newValue: 'new' }
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
        <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          {/* Header */}
          <Dialog.Title className="text-xl font-bold text-[var(--color-navy)] mb-4">
            ¿Confirmar cambios?
          </Dialog.Title>

          {/* Changes Diff */}
          <div className="mb-6">
            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
              Campos modificados:
            </p>

            {hasChanges ? (
              <ul className="space-y-2 text-sm">
                {changes.map((change) => (
                  <li key={change.field}>
                    <strong>{change.label}:</strong>{' '}
                    <span className="text-gray-600">{formatValue(change.oldValue)}</span>
                    <span className="mx-1">→</span>
                    <span className="text-[var(--color-teal)] font-medium">
                      {formatValue(change.newValue)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)] italic">No hay cambios.</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
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
