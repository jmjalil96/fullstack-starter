import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../../config/api'
import { Modal } from '../../../shared/components/ui/feedback/Modal'
import { Button } from '../../../shared/components/ui/forms/Button'
import { useToast } from '../../../shared/hooks/useToast'
import {
  useAvailableInvoiceClients,
  useAvailableInvoiceInsurers,
  useAvailableInvoicePolicies,
} from '../hooks/useInvoiceLookups'
import { useCreateInvoice } from '../hooks/useInvoiceMutations'
import { invoiceFormSchema, type InvoiceFormData } from '../schemas/createInvoiceSchema'

import { InvoiceForm } from './InvoiceForm'


interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateInvoiceModal({ isOpen, onClose }: CreateInvoiceModalProps) {
  const createMutation = useCreateInvoice()
  const toast = useToast()

  // Fetch available clients and insurers
  const { data: clients = [] } = useAvailableInvoiceClients()
  const { data: insurers = [] } = useAvailableInvoiceInsurers()

  // Form setup
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    mode: 'onChange',
    defaultValues: {
      invoiceNumber: '',
      clientId: '',
      insurerId: '',
      billingPeriod: '',
      totalAmount: '',
      taxAmount: '',
      actualAffiliateCount: '',
      issueDate: '',
      dueDate: '',
      policyIds: [],
    },
  })

  const { handleSubmit, setError, setFocus, reset, watch, setValue } = form

  // Watch client and insurer for policy fetching
  const clientId = watch('clientId')
  const insurerId = watch('insurerId')

  // Fetch policies only when both client and insurer are selected
  const { data: policies = [], isLoading: loadingPolicies } = useAvailableInvoicePolicies(
    { clientId, insurerId },
    !!(clientId && insurerId)
  )

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  // Reset policies when client changes
  useEffect(() => {
    setValue('policyIds', [], { shouldValidate: false })
  }, [clientId, setValue])

  // Reset policies when insurer changes
  useEffect(() => {
    setValue('policyIds', [], { shouldValidate: false })
  }, [insurerId, setValue])

  // Convert options for SearchableSelect
  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }))
  const insurerOptions = insurers.map((i) => ({
    value: i.id,
    label: i.code ? `${i.name} (${i.code})` : i.name,
  }))
  // Format policy options following the established pattern
  const policyOptions = policies.map((p) => ({
    value: p.id,
    label: `${p.policyNumber} - ${p.type || 'Sin tipo'}`,
  }))

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Convert string amounts to numbers
      const totalAmount = parseFloat(data.totalAmount.replace(',', '.'))
      const taxAmount = data.taxAmount ? parseFloat(data.taxAmount.replace(',', '.')) : undefined
      const actualAffiliateCount = parseInt(data.actualAffiliateCount, 10)

      await createMutation.mutateAsync({
        invoiceNumber: data.invoiceNumber,
        clientId: data.clientId,
        insurerId: data.insurerId,
        billingPeriod: data.billingPeriod,
        totalAmount,
        taxAmount,
        actualAffiliateCount,
        issueDate: data.issueDate,
        dueDate: data.dueDate || undefined,
        policyIds: data.policyIds && data.policyIds.length > 0 ? data.policyIds : undefined,
      })

      toast.success('Factura creada exitosamente')
      reset()
      onClose()
    } catch (error) {
      // Backend validation errors → map to form fields
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        const issues = error.metadata.issues as Array<{ path: string | string[]; message: string }>
        issues.forEach((issue) => {
          const fieldPath = Array.isArray(issue.path) ? issue.path.join('.') : issue.path
          setError(fieldPath as keyof InvoiceFormData, {
            type: 'server',
            message: issue.message,
          })
        })
        if (issues[0]) {
          const firstPath = Array.isArray(issues[0].path) ? issues[0].path.join('.') : issues[0].path
          setFocus(firstPath as keyof InvoiceFormData)
        }
        return // Don't show toast for validation errors
      }

      // Other errors (401, 403, 409, 500)
      const message =
        error instanceof ApiRequestError ? error.message : 'Error al crear factura'
      toast.error(message)
    }
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Factura"
      width="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-invoice-form"
            isLoading={createMutation.isPending}
          >
            Crear Factura
          </Button>
        </>
      }
    >
      <FormProvider {...form}>
        <InvoiceForm
          id="create-invoice-form"
          onSubmit={onSubmit}
          mode="create"
          clientOptions={clientOptions}
          insurerOptions={insurerOptions}
          policyOptions={policyOptions}
          loadingPolicies={loadingPolicies}
        />
      </FormProvider>
    </Modal>
  )
}