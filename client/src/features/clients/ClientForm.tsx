import type { FormEventHandler } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { DataGrid, DetailSection } from '../../shared/components/ui/data-display/DetailSection'
import { Checkbox } from '../../shared/components/ui/forms/Checkbox'
import { Input } from '../../shared/components/ui/forms/Input'
import { Textarea } from '../../shared/components/ui/forms/Textarea'

interface ClientFormProps {
  id?: string
  onSubmit?: FormEventHandler<HTMLFormElement>
  mode?: 'create' | 'edit'
}

export function ClientForm({ id, onSubmit, mode = 'create' }: ClientFormProps) {
  const { control } = useFormContext()

  return (
    <form id={id} onSubmit={onSubmit} className="space-y-6">
      <DetailSection title="Información Principal">
        <DataGrid columns={2}>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Razón Social"
                variant="light"
                required
                error={fieldState.error}
                {...field}
                value={field.value || ''}
              />
            )}
          />
          <Controller
            name="taxId"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="RUC / DNI"
                variant="light"
                required
                error={fieldState.error}
                {...field}
                value={field.value || ''}
              />
            )}
          />
        </DataGrid>
      </DetailSection>

      <DetailSection title="Contacto y Ubicación">
        <DataGrid columns={2}>
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Email Corporativo"
                type="email"
                variant="light"
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
                variant="light"
                error={fieldState.error}
                {...field}
                value={field.value || ''}
              />
            )}
          />
          <Controller
            name="address"
            control={control}
            render={({ field, fieldState }) => (
              <Textarea
                label="Dirección Fiscal"
                variant="light"
                rows={3}
                error={fieldState.error}
                className="col-span-full"
                {...field}
                value={field.value || ''}
              />
            )}
          />
        </DataGrid>
      </DetailSection>

      {mode === 'edit' && (
        <DetailSection title="Estado">
          <Controller
            name="isActive"
            control={control}
            render={({ field, fieldState }) => (
              <Checkbox
                label="Cliente Activo"
                variant="light"
                checked={field.value}
                onChange={field.onChange}
                error={fieldState.error}
              />
            )}
          />
        </DetailSection>
      )}
    </form>
  )
}
