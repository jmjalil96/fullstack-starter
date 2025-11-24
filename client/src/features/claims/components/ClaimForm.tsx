import type { FormEventHandler } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { DataGrid, DetailSection } from '../../../shared/components/ui/data-display/DetailSection'
import { StatusBadge } from '../../../shared/components/ui/data-display/StatusBadge'
import { CurrencyInput } from '../../../shared/components/ui/forms/CurrencyInput'
import { DateInput } from '../../../shared/components/ui/forms/DateInput'
import { Input } from '../../../shared/components/ui/forms/Input'
import { SearchableSelect } from '../../../shared/components/ui/forms/SearchableSelect'
import { Textarea } from '../../../shared/components/ui/forms/Textarea'

interface ClaimFormProps {
  id?: string
  onSubmit?: FormEventHandler<HTMLFormElement>
  policyOptions?: Array<{ value: string; label: string }>
  // Read-only display data (for Partes Involucradas section)
  clientName?: string
  affiliateName?: string
  patientName?: string
  patientRelationship?: 'self' | 'dependent'
}

export function ClaimForm({
  id,
  onSubmit,
  policyOptions = [],
  clientName,
  affiliateName,
  patientName,
  patientRelationship,
}: ClaimFormProps) {
  const { control } = useFormContext()

  return (
    <form id={id} onSubmit={onSubmit} className="space-y-6">
      {/* Section 1: Información del Reclamo */}
      <DetailSection title="Información del Reclamo">
        <div className="space-y-6">
          <DataGrid columns={1}>
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Textarea
                  label="Descripción"
                  variant="light"
                  rows={3}
                  error={fieldState.error}
                  {...field}
                  value={field.value || ''}
                />
              )}
            />
          </DataGrid>
          <DataGrid columns={2}>
          <Controller
            name="type"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Tipo de Reclamo"
                variant="light"
                error={fieldState.error}
                {...field}
                value={field.value || ''}
              />
            )}
          />
          <Controller
            name="incidentDate"
            control={control}
            render={({ field, fieldState }) => (
              <DateInput
                label="Fecha del Incidente"
                variant="light"
                error={fieldState.error}
                {...field}
              />
            )}
          />
        </DataGrid>
        <DataGrid columns={2}>
          <Controller
            name="submittedDate"
            control={control}
            render={({ field, fieldState }) => (
              <DateInput
                label="Fecha de Envío"
                variant="light"
                error={fieldState.error}
                {...field}
              />
            )}
          />
          <Controller
            name="resolvedDate"
            control={control}
            render={({ field, fieldState }) => (
              <DateInput
                label="Fecha de Resolución"
                variant="light"
                error={fieldState.error}
                {...field}
              />
            )}
          />
        </DataGrid>
        </div>
      </DetailSection>

      {/* Section 2: Montos y Póliza */}
      <DetailSection title="Montos y Póliza">
        <DataGrid columns={3}>
          <Controller
            name="amount"
            control={control}
            render={({ field, fieldState }) => (
              <CurrencyInput
                label="Monto Reclamado"
                variant="light"
                error={fieldState.error}
                {...field}
              />
            )}
          />
          <Controller
            name="approvedAmount"
            control={control}
            render={({ field, fieldState }) => (
              <CurrencyInput
                label="Monto Aprobado"
                variant="light"
                error={fieldState.error}
                {...field}
              />
            )}
          />
          <Controller
            name="policyId"
            control={control}
            render={({ field, fieldState }) => (
              <SearchableSelect
                label="Póliza"
                options={policyOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Seleccionar póliza..."
                error={fieldState.error}
              />
            )}
          />
        </DataGrid>
      </DetailSection>

      {/* Section 3: Partes Involucradas (Read-only) */}
      <DetailSection title="Partes Involucradas">
        <DataGrid columns={3}>
          <div>
            <span className="block text-xs font-bold text-[var(--color-navy)] uppercase tracking-wider mb-1.5">
              Cliente
            </span>
            <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
              {clientName || '—'}
            </div>
          </div>
          <div>
            <span className="block text-xs font-bold text-[var(--color-navy)] uppercase tracking-wider mb-1.5">
              Afiliado
            </span>
            <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
              {affiliateName || '—'}
            </div>
          </div>
          <div>
            <span className="block text-xs font-bold text-[var(--color-navy)] uppercase tracking-wider mb-1.5">
              Paciente
            </span>
            <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md border border-gray-200 flex items-center gap-2">
              <span>{patientName || '—'}</span>
              {patientRelationship && (
                <StatusBadge
                  label={patientRelationship === 'self' ? 'Titular' : 'Dependiente'}
                  color={patientRelationship === 'self' ? 'blue' : 'purple'}
                  size="sm"
                />
              )}
            </div>
          </div>
        </DataGrid>
      </DetailSection>
    </form>
  )
}
