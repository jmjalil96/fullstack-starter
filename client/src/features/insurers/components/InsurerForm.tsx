import type { FormEventHandler } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { DataGrid, DetailSection } from '../../../shared/components/ui/data-display/DetailSection'
import { Checkbox } from '../../../shared/components/ui/forms/Checkbox'
import { Input } from '../../../shared/components/ui/forms/Input'

interface InsurerFormProps {
  id?: string
  onSubmit?: FormEventHandler<HTMLFormElement>
  mode?: 'create' | 'edit'
}

export function InsurerForm({
  id,
  onSubmit,
  mode = 'create',
}: InsurerFormProps) {
  const { control } = useFormContext()

  return (
    <form id={id} onSubmit={onSubmit} className="space-y-6">
      {/* Section 1: Información Básica */}
      <DetailSection title="Información Básica">
        <DataGrid columns={2}>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Nombre"
                variant="light"
                required
                error={fieldState.error}
                placeholder="Ej: MAPFRE Seguros"
                {...field}
                value={field.value || ''}
              />
            )}
          />
          <Controller
            name="code"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Código"
                variant="light"
                error={fieldState.error}
                placeholder="Ej: MAPFRE"
                {...field}
                value={field.value || ''}
              />
            )}
          />
        </DataGrid>
      </DetailSection>

      {/* Section 2: Información de Contacto */}
      <DetailSection title="Información de Contacto">
        <DataGrid columns={2}>
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Email"
                type="email"
                variant="light"
                error={fieldState.error}
                placeholder="contacto@aseguradora.com"
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
                placeholder="+51-1-2345678"
                {...field}
                value={field.value || ''}
              />
            )}
          />
          <Controller
            name="website"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Sitio Web"
                type="url"
                variant="light"
                error={fieldState.error}
                placeholder="https://www.aseguradora.com"
                className="col-span-2"
                {...field}
                value={field.value || ''}
              />
            )}
          />
        </DataGrid>
      </DetailSection>

      {/* Section 3: Estado (Edit Only) */}
      {mode === 'edit' && (
        <DetailSection title="Estado">
          <Controller
            name="isActive"
            control={control}
            render={({ field, fieldState }) => (
              <Checkbox
                label="Aseguradora Activa"
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
