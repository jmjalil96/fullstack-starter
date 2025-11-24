import type { FormEventHandler } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { DataGrid, DetailSection } from '../../shared/components/ui/data-display/DetailSection'
import { CurrencyInput } from '../../shared/components/ui/forms/CurrencyInput'
import { DateInput } from '../../shared/components/ui/forms/DateInput'
import { Input } from '../../shared/components/ui/forms/Input'
import { SearchableSelect } from '../../shared/components/ui/forms/SearchableSelect'

interface PolicyFormProps {
  id?: string
  onSubmit?: FormEventHandler<HTMLFormElement>
  mode?: 'create' | 'edit'
  clientOptions?: Array<{ value: string; label: string }>
  insurerOptions?: Array<{ value: string; label: string }>
}

export function PolicyForm({
  id,
  onSubmit,
  mode = 'create',
  clientOptions = [],
  insurerOptions = [],
}: PolicyFormProps) {
  const { control } = useFormContext()

  return (
    <form id={id} onSubmit={onSubmit} className="space-y-6">
      {/* Section 1: Información Básica */}
      <DetailSection title="Información Básica">
        <DataGrid columns={2}>
          <Controller
            name="policyNumber"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Número de Póliza"
                variant="light"
                required
                error={fieldState.error}
                {...field}
                value={field.value || ''}
              />
            )}
          />
          <Controller
            name="type"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Tipo"
                variant="light"
                error={fieldState.error}
                {...field}
                value={field.value || ''}
              />
            )}
          />
        </DataGrid>
      </DetailSection>

      {/* Section 2: Cliente y Aseguradora */}
      <DetailSection title="Cliente y Aseguradora">
        <DataGrid columns={2}>
          <Controller
            name="clientId"
            control={control}
            render={({ field, fieldState }) => (
              <SearchableSelect
                label="Cliente"
                required
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
                required
                options={insurerOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Seleccionar aseguradora..."
                error={fieldState.error}
              />
            )}
          />
        </DataGrid>
      </DetailSection>

      {/* Section 3: Fechas de Vigencia */}
      <DetailSection title="Fechas de Vigencia">
        <DataGrid columns={2}>
          <Controller
            name="startDate"
            control={control}
            render={({ field, fieldState }) => (
              <DateInput
                label="Fecha de Inicio"
                variant="light"
                error={fieldState.error}
                {...field}
              />
            )}
          />
          <Controller
            name="endDate"
            control={control}
            render={({ field, fieldState }) => (
              <DateInput
                label="Fecha de Fin"
                variant="light"
                error={fieldState.error}
                {...field}
              />
            )}
          />
        </DataGrid>
      </DetailSection>

      {/* Only show financial fields in edit mode */}
      {mode === 'edit' && (
        <>
          {/* Section 4: Cobertura y Copagos */}
          <DetailSection title="Cobertura y Copagos">
            <DataGrid columns={3}>
              <Controller
                name="ambCopay"
                control={control}
                render={({ field, fieldState }) => (
                  <CurrencyInput
                    label="Copago Ambulatorio"
                    variant="light"
                    error={fieldState.error}
                    {...field}
                  />
                )}
              />
              <Controller
                name="hospCopay"
                control={control}
                render={({ field, fieldState }) => (
                  <CurrencyInput
                    label="Copago Hospitalario"
                    variant="light"
                    error={fieldState.error}
                    {...field}
                  />
                )}
              />
              <Controller
                name="maternity"
                control={control}
                render={({ field, fieldState }) => (
                  <CurrencyInput
                    label="Cobertura Maternidad"
                    variant="light"
                    error={fieldState.error}
                    {...field}
                  />
                )}
              />
            </DataGrid>
          </DetailSection>

          {/* Section 5: Primas */}
          <DetailSection title="Primas">
            <DataGrid columns={3}>
              <Controller
                name="tPremium"
                control={control}
                render={({ field, fieldState }) => (
                  <CurrencyInput
                    label="Prima Titular"
                    variant="light"
                    error={fieldState.error}
                    {...field}
                  />
                )}
              />
              <Controller
                name="tplus1Premium"
                control={control}
                render={({ field, fieldState }) => (
                  <CurrencyInput
                    label="Prima T+1"
                    variant="light"
                    error={fieldState.error}
                    {...field}
                  />
                )}
              />
              <Controller
                name="tplusfPremium"
                control={control}
                render={({ field, fieldState }) => (
                  <CurrencyInput
                    label="Prima T+F"
                    variant="light"
                    error={fieldState.error}
                    {...field}
                  />
                )}
              />
            </DataGrid>
          </DetailSection>

          {/* Section 6: Costos */}
          <DetailSection title="Costos">
            <DataGrid columns={2}>
              <Controller
                name="taxRate"
                control={control}
                render={({ field, fieldState }) => (
                  <CurrencyInput
                    label="Tasa de Impuesto"
                    variant="light"
                    error={fieldState.error}
                    {...field}
                  />
                )}
              />
              <Controller
                name="additionalCosts"
                control={control}
                render={({ field, fieldState }) => (
                  <CurrencyInput
                    label="Costos Adicionales"
                    variant="light"
                    error={fieldState.error}
                    {...field}
                  />
                )}
              />
            </DataGrid>
          </DetailSection>
        </>
      )}
    </form>
  )
}
