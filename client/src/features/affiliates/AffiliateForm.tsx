import type { FormEventHandler } from 'react'
import { useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { DataGrid, DetailSection } from '../../shared/components/ui/data-display/DetailSection'
import { Checkbox } from '../../shared/components/ui/forms/Checkbox'
import { DateInput } from '../../shared/components/ui/forms/DateInput'
import { Input } from '../../shared/components/ui/forms/Input'
import { SearchableSelect, type SelectOption } from '../../shared/components/ui/forms/SearchableSelect'

interface AffiliateFormProps {
  id?: string
  onSubmit?: FormEventHandler<HTMLFormElement>
  mode?: 'create' | 'edit'
  clientOptions?: SelectOption[]
  ownerOptions?: SelectOption[]
}

// Affiliate type options
const AFFILIATE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'OWNER', label: 'Titular' },
  { value: 'DEPENDENT', label: 'Dependiente' },
]

// Coverage type options
const COVERAGE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'T', label: 'T - Titular' },
  { value: 'TPLUS1', label: 'TPLUS1 - Titular + 1' },
  { value: 'TPLUSF', label: 'TPLUSF - Titular + Familia' },
]

export function AffiliateForm({
  id,
  onSubmit,
  mode = 'create',
  clientOptions = [],
  ownerOptions = [],
}: AffiliateFormProps) {
  const { control, watch, setValue } = useFormContext()

  // Watch affiliateType for conditional fields
  const affiliateType = watch('affiliateType')

  // Clear primaryAffiliateId when switching to OWNER (prevent backend error)
  useEffect(() => {
    if (affiliateType === 'OWNER') {
      setValue('primaryAffiliateId', '')
    }
  }, [affiliateType, setValue])

  return (
    <form id={id} onSubmit={onSubmit} className="space-y-6">
      {/* Section 1: Cliente y Tipo */}
      <DetailSection title="Cliente y Tipo">
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
            name="affiliateType"
            control={control}
            render={({ field, fieldState }) => (
              <SearchableSelect
                label="Tipo de Afiliado"
                required
                options={AFFILIATE_TYPE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder="Seleccionar tipo..."
                error={fieldState.error}
              />
            )}
          />

          {/* Conditional: Primary Affiliate (only for DEPENDENT) */}
          {affiliateType === 'DEPENDENT' && (
            <Controller
              name="primaryAffiliateId"
              control={control}
              render={({ field, fieldState }) => (
                <SearchableSelect
                  label="Afiliado Titular"
                  required
                  options={ownerOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleccionar titular..."
                  error={fieldState.error}
                  className="col-span-2"
                />
              )}
            />
          )}
        </DataGrid>
      </DetailSection>

      {/* Section 2: Información Personal */}
      <DetailSection title="Información Personal">
        <DataGrid columns={2}>
          <Controller
            name="firstName"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Nombre"
                variant="light"
                required
                error={fieldState.error}
                {...field}
                value={field.value || ''}
              />
            )}
          />
          <Controller
            name="lastName"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Apellido"
                variant="light"
                required
                error={fieldState.error}
                {...field}
                value={field.value || ''}
              />
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Email"
                type="email"
                variant="light"
                required={affiliateType === 'OWNER'}
                error={fieldState.error}
                {...field}
                value={field.value || ''}
              />
            )}
          />
          <Controller
            name="phone"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Teléfono"
                type="tel"
                variant="light"
                error={fieldState.error}
                {...field}
                value={field.value || ''}
              />
            )}
          />
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field, fieldState }) => (
              <DateInput
                label="Fecha de Nacimiento"
                variant="light"
                error={fieldState.error}
                {...field}
              />
            )}
          />
        </DataGrid>
      </DetailSection>

      {/* Section 3: Información de Documento */}
      <DetailSection title="Información de Documento">
        <DataGrid columns={2}>
          <Controller
            name="documentType"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Tipo de Documento"
                variant="light"
                error={fieldState.error}
                placeholder="DNI, Pasaporte, etc."
                {...field}
                value={field.value || ''}
              />
            )}
          />
          <Controller
            name="documentNumber"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Número de Documento"
                variant="light"
                error={fieldState.error}
                {...field}
                value={field.value || ''}
              />
            )}
          />
        </DataGrid>
      </DetailSection>

      {/* Section 4: Información de Cobertura */}
      <DetailSection title="Información de Cobertura">
        <DataGrid columns={1}>
          <Controller
            name="coverageType"
            control={control}
            render={({ field, fieldState }) => (
              <SearchableSelect
                label="Tipo de Cobertura"
                options={COVERAGE_TYPE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder="Seleccionar cobertura..."
                error={fieldState.error}
              />
            )}
          />
        </DataGrid>
      </DetailSection>

      {/* Section 5: Estado (Edit Only) */}
      {mode === 'edit' && (
        <DetailSection title="Estado">
          <Controller
            name="isActive"
            control={control}
            render={({ field, fieldState }) => (
              <Checkbox
                label="Afiliado Activo"
                error={fieldState.error}
                {...field}
                checked={field.value}
              />
            )}
          />
        </DetailSection>
      )}
    </form>
  )
}
