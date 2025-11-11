/**
 * InsurerSelect - Insurer selection field for new policy form
 * Connects useAvailableInsurers hook to SearchableSelect component
 */

import { Controller, type Control, type FieldError } from 'react-hook-form'

import { SearchableSelect } from '../../../../shared/components/form'
import { useAvailableInsurers } from '../../../../shared/hooks/policies'
import type { PolicyFormData } from '../schema'

/**
 * Props for InsurerSelect component
 */
interface InsurerSelectProps {
  /** react-hook-form control object */
  control: Control<PolicyFormData>
  /** react-hook-form validation error */
  error?: FieldError
}

/**
 * InsurerSelect - Select insurer for new policy
 *
 * Integrates with react-hook-form using Controller.
 * Fetches available insurers based on user permissions.
 * Always manages the "insurerId" field.
 *
 * @example
 * const { control, formState: { errors } } = useForm<PolicyFormData>()
 *
 * <InsurerSelect
 *   control={control}
 *   error={errors.insurerId}
 * />
 */
export function InsurerSelect({ control, error }: InsurerSelectProps) {
  // Fetch available insurers
  const { insurers, loading, error: hookError } = useAvailableInsurers()

  // Transform insurers to SelectOption format
  const options = insurers.map((insurer) => ({
    value: insurer.id,
    label: `${insurer.name}${insurer.code ? ` (${insurer.code})` : ''}`,
  }))

  // Determine error to display (RHF error takes priority)
  const displayError = error?.message || hookError || undefined

  return (
    <Controller
      name="insurerId"
      control={control}
      render={({ field }) => (
        <SearchableSelect
          ref={field.ref}
          label="Aseguradora"
          options={options}
          value={field.value || ''}
          onChange={field.onChange}
          loading={loading}
          error={displayError}
          disabled={loading}
          placeholder="Selecciona una aseguradora..."
        />
      )}
    />
  )
}
