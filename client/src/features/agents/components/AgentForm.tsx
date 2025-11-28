import type { FormEventHandler } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { DataGrid, DetailSection } from '../../../shared/components/ui/data-display/DetailSection'
import { Checkbox } from '../../../shared/components/ui/forms/Checkbox'
import { Input } from '../../../shared/components/ui/forms/Input'

interface AgentFormProps {
  id?: string
  onSubmit?: FormEventHandler<HTMLFormElement>
}

export function AgentForm({
  id,
  onSubmit,
}: AgentFormProps) {
  const { control } = useFormContext()

  return (
    <form id={id} onSubmit={onSubmit} className="space-y-6">
      {/* Section 1: Información Personal */}
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
                placeholder="Ej: María"
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
                placeholder="Ej: García"
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
                placeholder="+51 999 888 777"
                {...field}
                value={field.value || ''}
              />
            )}
          />
        </DataGrid>
      </DetailSection>

      {/* Section 2: Información del Agente */}
      <DetailSection title="Información del Agente">
        <DataGrid columns={2}>
          <Controller
            name="agentCode"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Código de Agente"
                variant="light"
                error={fieldState.error}
                placeholder="Ej: AGT-001"
                {...field}
                value={field.value || ''}
              />
            )}
          />
        </DataGrid>
      </DetailSection>

      {/* Section 3: Estado */}
      <DetailSection title="Estado">
        <Controller
          name="isActive"
          control={control}
          render={({ field, fieldState }) => (
            <Checkbox
              label="Agente Activo"
              error={fieldState.error}
              {...field}
              checked={field.value}
            />
          )}
        />
      </DetailSection>
    </form>
  )
}
