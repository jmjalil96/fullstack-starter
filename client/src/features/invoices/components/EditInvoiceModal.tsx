import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../../config/api'
import {
  ConfirmationModal,
  type ChangeRecord,
} from '../../../shared/components/ui/feedback/ConfirmationModal'
import { Modal } from '../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../shared/components/ui/forms/Button'
import { useToast } from '../../../shared/hooks/useToast'
import { formatFieldValue } from '../../../shared/utils/formatters'
import { getInvoiceFormValues, mapInvoiceEditFormToUpdateRequest } from '../editInvoiceMappers'
import {
  useAvailableInvoiceClients,
  useAvailableInvoiceInsurers,
} from '../hooks/useInvoiceLookups'
import { useUpdateInvoice } from '../hooks/useInvoiceMutations'
import { useInvoiceDetail } from '../hooks/useInvoices'
import { FIELD_LABELS } from '../invoiceLifecycle'
import type { InvoiceUpdateRequest } from '../invoices'
import { invoiceUpdateSchema, type InvoiceEditFormData } from '../schemas/editInvoiceSchema'

import { InvoiceForm } from './InvoiceForm'

interface EditInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  invoiceId: string | null
}

/**
 * Edit invoice modal with two-step confirmation flow
 *
 * Flow:
 * 1. User edits form fields
 * 2. Click "Revisar Cambios" → Shows diff of changes
 * 3. User confirms → Saves to API
 *
 * Features:
 * - Uses InvoiceForm (DateInput, CurrencyInput, etc.)
 * - Smart diff calculation (formats values for comparison)
 * - Server error mapping to form fields
 * - Two-step confirmation (prevents accidental saves)
 *
 * @example
 * <EditInvoiceModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   invoiceId={invoice.id}
 * />
 */
export function EditInvoiceModal({ isOpen, onClose, invoiceId }: EditInvoiceModalProps) {
  const { data: invoice, isLoading: isLoadingData } = useInvoiceDetail(invoiceId || '')
  const updateMutation = useUpdateInvoice()
  const toast = useToast()

  // Fetch available clients and insurers
  const { data: clients = [] } = useAvailableInvoiceClients()
  const { data: insurers = [] } = useAvailableInvoiceInsurers()

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }))
  const insurerOptions = insurers.map((i) => ({
    value: i.id,
    label: i.code ? `${i.name} (${i.code})` : i.name,
  }))

  const [pendingData, setPendingData] = useState<InvoiceUpdateRequest | null>(null)
  const [changes, setChanges] = useState<ChangeRecord[]>([])
  const [isConfirmOpen, setConfirmOpen] = useState(false)

  const form = useForm<InvoiceEditFormData>({
    resolver: zodResolver(invoiceUpdateSchema),
    mode: 'onChange',
    defaultValues: getInvoiceFormValues(invoice),
  })

  const { handleSubmit, setError, reset, formState: { dirtyFields } } = form

  // Reset form when invoice loads or modal reopens
  useEffect(() => {
    if (invoice && isOpen) {
      reset(getInvoiceFormValues(invoice))
    }
    if (!isOpen) {
      setPendingData(null)
      setChanges([])
      setConfirmOpen(false)
    }
  }, [invoice, isOpen, reset])

  // Step 1: Calculate diffs
  const onSaveClick = handleSubmit((formData) => {
    if (!invoice) return

    const diffs: ChangeRecord[] = []

    // Check each dirty field for changes
    Object.keys(dirtyFields).forEach((key) => {
      const oldValue = invoice[key as keyof typeof invoice]
      const newValue = formData[key as keyof typeof formData]

      if (oldValue !== newValue) {
        diffs.push({
          field: key,
          label: FIELD_LABELS[key as keyof typeof FIELD_LABELS] || key,
          oldValue: formatFieldValue(key, oldValue),
          newValue: formatFieldValue(key, newValue),
        })
      }
    })

    if (diffs.length === 0) {
      toast.info('No hay cambios para guardar')
      return
    }

    const updatePayload = mapInvoiceEditFormToUpdateRequest(formData, dirtyFields)

    setPendingData(updatePayload)
    setChanges(diffs)
    setConfirmOpen(true)
  })

  // Step 2: Confirmed save
  const handleConfirm = async () => {
    if (!invoiceId || !pendingData) return

    try {
      await updateMutation.mutateAsync({
        id: invoiceId,
        data: pendingData,
      })
      toast.success('Factura actualizada exitosamente')
      setConfirmOpen(false)
      onClose()
    } catch (error) {
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        setConfirmOpen(false)
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof InvoiceEditFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        return
      }

      const message =
        error instanceof ApiRequestError ? error.message : 'Error al actualizar factura'
      toast.error(message)
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen && !isConfirmOpen}
        onClose={onClose}
        title="Editar Factura"
        width="xl"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form="edit-invoice-form" disabled={isLoadingData}>
              Revisar Cambios
            </Button>
          </>
        }
      >
        {isLoadingData || !invoice ? (
          <div className="h-40 animate-pulse bg-gray-100 rounded-xl" />
        ) : (
          <FormProvider {...form}>
            <InvoiceForm
              id="edit-invoice-form"
              onSubmit={onSaveClick}
              mode="edit"
              clientOptions={clientOptions}
              insurerOptions={insurerOptions}
            />
          </FormProvider>
        )}
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        changes={changes}
        isLoading={updateMutation.isPending}
      />
    </>
  )
}
