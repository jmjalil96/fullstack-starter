import type { FormEventHandler } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { DataGrid, DetailSection } from '../../../shared/components/ui/data-display/DetailSection'
import { CurrencyInput } from '../../../shared/components/ui/forms/CurrencyInput'
import { DateInput } from '../../../shared/components/ui/forms/DateInput'
import { Input } from '../../../shared/components/ui/forms/Input'
import { SearchableSelect } from '../../../shared/components/ui/forms/SearchableSelect'
import { Textarea } from '../../../shared/components/ui/forms/Textarea'

interface InvoiceFormProps {
  id?: string
  onSubmit?: FormEventHandler<HTMLFormElement>
  mode?: 'create' | 'edit'
  clientOptions?: Array<{ value: string; label: string }>
  insurerOptions?: Array<{ value: string; label: string }>
}

export function InvoiceForm({
  id,
  onSubmit,
  mode = 'edit',
  clientOptions = [],
  insurerOptions = [],
}: InvoiceFormProps) {
  const { control } = useFormContext()

  return (
    <form id={id} onSubmit={onSubmit} className="space-y-6">
      {/* Section 1: Identificación */}
      <DetailSection title="Identificación">
        <div className="space-y-6">
          <DataGrid columns={2}>
            <Controller
              name="invoiceNumber"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label="Número de Factura"
                  variant="light"
                  error={fieldState.error}
                  {...field}
                  value={field.value || ''}
                />
              )}
            />
            <Controller
              name="insurerInvoiceNumber"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label="Nº Factura Aseguradora"
                  variant="light"
                  error={fieldState.error}
                  {...field}
                  value={field.value || ''}
                />
              )}
            />
          </DataGrid>
          <DataGrid columns={2}>
            <Controller
              name="clientId"
              control={control}
              render={({ field, fieldState }) => (
                <SearchableSelect
                  label="Cliente"
                  options={clientOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleccionar cliente..."
                  error={fieldState.error}
                />
              )}
            />
            <Controller
              name="insurerId"
              control={control}
              render={({ field, fieldState }) => (
                <SearchableSelect
                  label="Aseguradora"
                  options={insurerOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleccionar aseguradora..."
                  error={fieldState.error}
                />
              )}
            />
          </DataGrid>
        </div>
      </DetailSection>

      {/* Section 2: Montos */}
      <DetailSection title="Montos">
        <div className="space-y-6">
          <DataGrid columns={2}>
            <Controller
              name="totalAmount"
              control={control}
              render={({ field, fieldState }) => (
                <CurrencyInput
                  label="Monto Total"
                  variant="light"
                  error={fieldState.error}
                  {...field}
                />
              )}
            />
            <Controller
              name="taxAmount"
              control={control}
              render={({ field, fieldState }) => (
                <CurrencyInput
                  label="Impuestos"
                  variant="light"
                  error={fieldState.error}
                  {...field}
                />
              )}
            />
          </DataGrid>
          <DataGrid columns={2}>
            <Controller
              name="actualAffiliateCount"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label="Afiliados Facturados"
                  type="number"
                  variant="light"
                  error={fieldState.error}
                  {...field}
                  value={field.value || ''}
                />
              )}
            />
            <Controller
              name="expectedAmount"
              control={control}
              render={({ field, fieldState }) => (
                <CurrencyInput
                  label="Monto Esperado"
                  variant="light"
                  error={fieldState.error}
                  {...field}
                />
              )}
            />
          </DataGrid>
        </div>
      </DetailSection>

      {/* Section 3: Fechas y Período */}
      <DetailSection title="Fechas y Período">
        <div className="space-y-6">
          <DataGrid columns={2}>
            <Controller
              name="billingPeriod"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label="Período de Facturación (YYYY-MM)"
                  variant="light"
                  placeholder="2025-01"
                  error={fieldState.error}
                  {...field}
                  value={field.value || ''}
                />
              )}
            />
            <Controller
              name="issueDate"
              control={control}
              render={({ field, fieldState }) => (
                <DateInput
                  label="Fecha de Emisión"
                  variant="light"
                  error={fieldState.error}
                  {...field}
                />
              )}
            />
          </DataGrid>
          <DataGrid columns={2}>
            <Controller
              name="dueDate"
              control={control}
              render={({ field, fieldState }) => (
                <DateInput
                  label="Fecha de Vencimiento"
                  variant="light"
                  error={fieldState.error}
                  {...field}
                />
              )}
            />
            <Controller
              name="paymentDate"
              control={control}
              render={({ field, fieldState }) => (
                <DateInput
                  label="Fecha de Pago"
                  variant="light"
                  error={fieldState.error}
                  {...field}
                />
              )}
            />
          </DataGrid>
        </div>
      </DetailSection>

      {/* Section 4: Estado de Pago */}
      {mode === 'edit' && (
        <DetailSection title="Estado de Pago">
          <DataGrid columns={2}>
            <Controller
              name="paymentStatus"
              control={control}
              render={({ field, fieldState }) => (
                <SearchableSelect
                  label="Estado de Pago"
                  options={[
                    { value: 'PENDING_PAYMENT', label: 'Pendiente de Pago' },
                    { value: 'PAID', label: 'Pagada' },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleccionar..."
                  error={fieldState.error}
                />
              )}
            />
          </DataGrid>
        </DetailSection>
      )}

      {/* Section 5: Notas */}
      <DetailSection title="Notas de Discrepancia">
        <Controller
          name="discrepancyNotes"
          control={control}
          render={({ field, fieldState }) => (
            <Textarea
              label="Notas"
              variant="light"
              rows={3}
              placeholder="Notas sobre discrepancias o correcciones..."
              error={fieldState.error}
              {...field}
              value={field.value || ''}
            />
          )}
        />
      </DetailSection>
    </form>
  )
}
