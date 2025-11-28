import type { FormEventHandler } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { DataGrid, DetailSection } from '../../../shared/components/ui/data-display/DetailSection'
import { Checkbox } from '../../../shared/components/ui/forms/Checkbox'
import { Input } from '../../../shared/components/ui/forms/Input'

interface EmployeeFormProps {
  id?: string
  onSubmit?: FormEventHandler<HTMLFormElement>
}

export function EmployeeForm({
  id,
  onSubmit,
}: EmployeeFormProps) {
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
                placeholder="Ej: Juan"
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
                placeholder="Ej: Pérez"
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

      {/* Section 2: Información Laboral */}
      <DetailSection title="Información Laboral">
        <DataGrid columns={2}>
          <Controller
            name="position"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Cargo"
                variant="light"
                error={fieldState.error}
                placeholder="Ej: Gerente de Operaciones"
                {...field}
                value={field.value || ''}
              />
            )}
          />
          <Controller
            name="department"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Departamento"
                variant="light"
                error={fieldState.error}
                placeholder="Ej: Operaciones"
                {...field}
                value={field.value || ''}
              />
            )}
          />
          <Controller
            name="employeeCode"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label="Código de Empleado"
                variant="light"
                error={fieldState.error}
                placeholder="Ej: EMP-001"
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
              label="Empleado Activo"
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
