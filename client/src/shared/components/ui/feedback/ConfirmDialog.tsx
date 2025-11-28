import { Button } from '../forms/Button'

import { Modal } from './Modal'

interface ConfirmDialogProps {
  /** Whether dialog is open */
  isOpen: boolean
  /** Callback to close dialog */
  onClose: () => void
  /** Callback when user confirms */
  onConfirm: () => void
  /** Dialog title */
  title: string
  /** Message to display */
  message: string
  /** Confirm button label */
  confirmLabel?: string
  /** Cancel button label */
  cancelLabel?: string
  /** Loading state during confirmation */
  isLoading?: boolean
  /** Variant for styling (danger shows red confirm button) */
  variant?: 'default' | 'danger'
}

/**
 * Simple confirmation dialog for yes/no decisions
 *
 * @example
 * <ConfirmDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Eliminar Usuario"
 *   message="¿Está seguro que desea eliminar este usuario?"
 *   confirmLabel="Eliminar"
 *   variant="danger"
 *   isLoading={isDeleting}
 * />
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            isLoading={isLoading}
            className={
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : undefined
            }
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600">{message}</p>
    </Modal>
  )
}
