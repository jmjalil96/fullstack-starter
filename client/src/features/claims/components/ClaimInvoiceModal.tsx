/**
 * Unified modal for claim invoice CRUD operations
 *
 * Modes:
 * - create: Empty form to add a new invoice
 * - edit: Pre-filled form to edit an existing invoice
 * - delete: Confirmation to remove an invoice
 */

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../../config/api'
import { Modal } from '../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../shared/components/ui/forms/Button'
import { CurrencyInput } from '../../../shared/components/ui/forms/CurrencyInput'
import { Input } from '../../../shared/components/ui/forms/Input'
import { useToast } from '../../../shared/hooks/useToast'
import type { ClaimInvoiceItem } from '../claims'
import {
  useAddClaimInvoice,
  useEditClaimInvoice,
  useRemoveClaimInvoice,
} from '../hooks/useClaimInvoiceMutations'
import {
  claimInvoiceSchema,
  formatFormAmount,
  parseFormAmount,
  type ClaimInvoiceFormData,
} from '../schemas/claimInvoiceSchema'

type ModalMode = 'create' | 'edit' | 'delete'

interface ClaimInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  claimId: string
  invoice?: ClaimInvoiceItem | null
  mode: ModalMode
}

/**
 * Modal titles per mode
 */
const MODAL_TITLES: Record<ModalMode, string> = {
  create: 'Agregar Factura',
  edit: 'Editar Factura',
  delete: 'Eliminar Factura',
}

/**
 * Submit button labels per mode
 */
const SUBMIT_LABELS: Record<ModalMode, string> = {
  create: 'Agregar Factura',
  edit: 'Guardar',
  delete: 'Eliminar Factura',
}

/**
 * Convert invoice to form default values
 */
function getFormDefaults(invoice?: ClaimInvoiceItem | null): ClaimInvoiceFormData {
  return {
    invoiceNumber: invoice?.invoiceNumber || '',
    providerName: invoice?.providerName || '',
    amountSubmitted: formatFormAmount(invoice?.amountSubmitted),
  }
}

export function ClaimInvoiceModal({
  isOpen,
  onClose,
  claimId,
  invoice,
  mode,
}: ClaimInvoiceModalProps) {
  const toast = useToast()

  // Mutations
  const addMutation = useAddClaimInvoice()
  const editMutation = useEditClaimInvoice()
  const removeMutation = useRemoveClaimInvoice()

  // Bulk create state (only used in create mode)
  const [addedCount, setAddedCount] = useState(0)

  // Form setup - use same schema for both modes (all fields required)
  const form = useForm<ClaimInvoiceFormData>({
    resolver: zodResolver(claimInvoiceSchema),
    mode: 'onChange',
    defaultValues: getFormDefaults(invoice),
  })

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form

  // Reset form when modal opens/closes or invoice changes
  useEffect(() => {
    if (isOpen) {
      reset(getFormDefaults(invoice))
      // Reset bulk create state when modal opens
      if (mode === 'create') {
        setAddedCount(0)
      }
    }
  }, [isOpen, invoice, reset, mode])

  // Check if any mutation is pending
  const isPending = addMutation.isPending || editMutation.isPending || removeMutation.isPending

  /**
   * Handle form submission (create/edit modes)
   */
  const onSubmit = handleSubmit(async (data) => {
    try {
      const apiData = {
        invoiceNumber: data.invoiceNumber,
        providerName: data.providerName,
        amountSubmitted: parseFormAmount(data.amountSubmitted),
      }

      if (mode === 'create') {
        await addMutation.mutateAsync({
          claimId,
          data: apiData,
        })
        toast.success('Factura agregada exitosamente')
        setAddedCount((prev) => prev + 1)
        reset(getFormDefaults(null)) // Clear form for next entry
        return // Don't call onClose - stay open for bulk add
      } else if (mode === 'edit' && invoice) {
        await editMutation.mutateAsync({
          claimId,
          invoiceId: invoice.id,
          data: apiData,
        })
        toast.success('Factura actualizada exitosamente')
      }

      onClose()
    } catch (error) {
      // Map server validation errors to form fields
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof ClaimInvoiceFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        return
      }

      // Show toast for other errors
      const message =
        error instanceof ApiRequestError ? error.message : 'Error al procesar la factura'
      toast.error(message)
    }
  })

  /**
   * Handle delete confirmation
   */
  const handleDelete = async () => {
    if (!invoice) return

    try {
      await removeMutation.mutateAsync({
        claimId,
        invoiceId: invoice.id,
      })
      toast.success('Factura eliminada exitosamente')
      onClose()
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : 'Error al eliminar la factura'
      toast.error(message)
    }
  }

  /**
   * Render delete confirmation content
   */
  const renderDeleteContent = () => {
    if (!invoice) return null

    const formattedAmount = new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(invoice.amountSubmitted)

    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-red-800">
              ¿Estás seguro de que deseas eliminar esta factura?
            </h4>
            <p className="text-sm text-red-600 mt-1">Esta acción no se puede deshacer.</p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
              <p className="text-sm text-gray-600">{invoice.providerName}</p>
            </div>
            <p className="font-semibold text-gray-900">{formattedAmount}</p>
          </div>
        </div>
      </div>
    )
  }

  /**
   * Render form content (create/edit modes)
   */
  const renderFormContent = () => (
    <form id="invoice-form" onSubmit={onSubmit} className="space-y-4">
      <Controller
        name="invoiceNumber"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="Número de Factura"
            placeholder="FAC-001"
            error={errors.invoiceNumber}
            variant="light"
            required
          />
        )}
      />

      <Controller
        name="providerName"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="Proveedor"
            placeholder="Hospital ABC"
            error={errors.providerName}
            variant="light"
            required
          />
        )}
      />

      <Controller
        name="amountSubmitted"
        control={control}
        render={({ field }) => (
          <CurrencyInput
            {...field}
            label="Monto Presentado ($)"
            error={errors.amountSubmitted}
            variant="light"
          />
        )}
      />

      {/* Session counter - only in create mode after at least one added */}
      {mode === 'create' && addedCount > 0 && (
        <p className="text-sm text-gray-500 text-center pt-2">
          {addedCount} factura{addedCount !== 1 ? 's' : ''} agregada{addedCount !== 1 ? 's' : ''}
        </p>
      )}
    </form>
  )

  /**
   * Render footer based on mode
   */
  const renderFooter = () => {
    if (mode === 'delete') {
      return (
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Eliminando...' : SUBMIT_LABELS.delete}
          </Button>
        </>
      )
    }

    // Create mode - different buttons after first add
    if (mode === 'create' && addedCount > 0) {
      return (
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cerrar
          </Button>
          <Button type="submit" form="invoice-form" disabled={isPending || isSubmitting}>
            {isPending ? 'Agregando...' : 'Agregar Otra'}
          </Button>
        </>
      )
    }

    // Edit mode or create before first add
    return (
      <>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" form="invoice-form" disabled={isPending || isSubmitting}>
          {isPending ? 'Guardando...' : SUBMIT_LABELS[mode]}
        </Button>
      </>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={MODAL_TITLES[mode]}
      width="sm"
      footer={renderFooter()}
    >
      {mode === 'delete' ? renderDeleteContent() : renderFormContent()}
    </Modal>
  )
}
