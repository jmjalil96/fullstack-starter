import type { FormEventHandler } from 'react'
import { useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { DataGrid, DetailSection } from '../../../shared/components/ui/data-display/DetailSection'
import { SearchableSelect } from '../../../shared/components/ui/forms/SearchableSelect'
import { Textarea } from '../../../shared/components/ui/forms/Textarea'
import type { ClaimFormData } from '../schemas/createClaimSchema'

interface CreateClaimFormProps {
  id?: string
  onSubmit?: FormEventHandler<HTMLFormElement>
  clientOptions: Array<{ value: string; label: string }>
  affiliateOptions: Array<{ value: string; label: string }>
  patientOptions: Array<{ value: string; label: string }>
  loadingAffiliates?: boolean
  loadingPatients?: boolean
}

export function CreateClaimForm({
  id,
  onSubmit,
  clientOptions,
  affiliateOptions,
  patientOptions,
  loadingAffiliates = false,
  loadingPatients = false,
}: CreateClaimFormProps) {
  const { control, watch, setValue } = useFormContext<ClaimFormData>()

  const clientId = watch('clientId')
  const affiliateId = watch('affiliateId')

  // Cascading reset: When client changes → clear affiliate + patient
  useEffect(() => {
    setValue('affiliateId', '', { shouldValidate: false })
    setValue('patientId', '', { shouldValidate: false })
  }, [clientId, setValue])

  // Cascading reset: When affiliate changes → clear patient
  useEffect(() => {
    setValue('patientId', '', { shouldValidate: false })
  }, [affiliateId, setValue])

  return (
    <form id={id} onSubmit={onSubmit} className="space-y-6">
      {/* Section 1: Selección de Partes */}
      <DetailSection title="Selección de Partes">
        <DataGrid columns={3}>
          {/* Client Select */}
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

          {/* Affiliate Select (disabled until client selected) */}
          <Controller
            name="affiliateId"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <SearchableSelect
                  label="Afiliado Titular"
                  required
                  options={affiliateOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={!clientId ? 'Selecciona un cliente primero' : 'Seleccionar afiliado...'}
                  disabled={!clientId}
                  isLoading={loadingAffiliates}
                  error={fieldState.error}
                />
                {!clientId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona un cliente para ver sus afiliados
                  </p>
                )}
              </div>
            )}
          />

          {/* Patient Select (disabled until affiliate selected) */}
          <Controller
            name="patientId"
            control={control}
            render={({ field, fieldState }) => (
              <div>
                <SearchableSelect
                  label="Paciente"
                  required
                  options={patientOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={!affiliateId ? 'Selecciona un afiliado primero' : 'Seleccionar paciente...'}
                  disabled={!affiliateId}
                  isLoading={loadingPatients}
                  error={fieldState.error}
                />
                {!affiliateId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona un afiliado para ver los pacientes disponibles
                  </p>
                )}
              </div>
            )}
          />
        </DataGrid>
      </DetailSection>

      {/* Section 2: Descripción del Reclamo */}
      <DetailSection title="Descripción del Reclamo">
        <Controller
          name="description"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <Textarea
                label="Descripción"
                required
                variant="light"
                rows={4}
                placeholder="Describe el motivo del reclamo, diagnóstico, tratamiento, etc."
                error={fieldState.error}
                {...field}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 3 caracteres, máximo 5000 caracteres
              </p>
            </>
          )}
        />
      </DetailSection>
    </form>
  )
}
