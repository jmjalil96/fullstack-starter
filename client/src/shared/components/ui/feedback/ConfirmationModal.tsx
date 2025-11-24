import { Button } from '../forms/Button'

import { Modal } from './Modal'

/**
 * Record of a single field change
 * Used to display before/after comparison
 */
export interface ChangeRecord {
  /** Field name (e.g., "description", "amount") */
  field: string
  /** Optional display label (e.g., "Descripción", "Monto") */
  label?: string
  /** Previous value (formatted string) */
  oldValue: string
  /** New value (formatted string) */
  newValue: string
}

interface ConfirmationModalProps {
  /** Whether modal is open */
  isOpen: boolean
  /** Callback to close modal */
  onClose: () => void
  /** Callback when user confirms */
  onConfirm: () => void
  /** Modal title */
  title?: string
  /** Array of changes to display */
  changes: ChangeRecord[]
  /** Loading state during confirmation */
  isLoading?: boolean
}

/**
 * Confirmation modal with change diff display
 * Shows before/after comparison of field changes
 *
 * Note: Caller should validate that changes array is not empty
 * before showing this modal. If empty, shows "No changes" message.
 *
 * @example
 * const changes: ChangeRecord[] = [
 *   { field: 'amount', label: 'Monto', oldValue: '$100.00', newValue: '$150.00' },
 *   { field: 'status', label: 'Estado', oldValue: 'Enviado', newValue: 'En Revisión' }
 * ]
 *
 * <ConfirmationModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleSave}
 *   title="Confirmar Cambios"
 *   changes={changes}
 *   isLoading={isSaving}
 * />
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Cambios',
  changes,
  isLoading,
}: ConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} isLoading={isLoading}>
            Confirmar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {changes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No hay cambios para confirmar
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-600">Estás a punto de guardar los siguientes cambios:</p>
            <ul className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3 list-none">
              {changes.map((change) => (
                <li key={change.field} className="grid grid-cols-1 gap-1 text-sm">
                  <span className="font-bold text-[var(--color-navy)] uppercase text-xs tracking-wider">
                    {change.label || change.field}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-red-500 line-through decoration-red-500/50 bg-red-50 px-1.5 rounded text-xs">
                      {change.oldValue || 'Vacío'}
                    </span>
                    <svg
                      className="w-3 h-3 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                    <span className="text-green-600 font-medium bg-green-50 px-1.5 rounded text-xs">
                      {change.newValue || 'Vacío'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Modal>
  )
}
