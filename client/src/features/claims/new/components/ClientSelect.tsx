/**
 * ClientSelect - Client selection field for new claim form
 * Connects useAvailableClients hook to SearchableSelect component
 */

import { Controller, type Control, type FieldError } from 'react-hook-form'

import { SearchableSelect } from '../../../../shared/components/form'
import { useAvailableClients } from '../../../../shared/hooks/claims'
import type { ClaimFormData } from '../schema'

/**
 * Props for ClientSelect component
 */
interface ClientSelectProps {
  /** react-hook-form control object */
  control: Control<ClaimFormData>
  /** react-hook-form validation error */
  error?: FieldError
}

/**
 * ClientSelect - Select client for new claim
 *
 * Integrates with react-hook-form using Controller.
 * Fetches available clients based on user permissions.
 * Always manages the "clientId" field.
 *
 * @example
 * const { control, formState: { errors } } = useForm<ClaimFormData>()
 *
 * <ClientSelect
 *   control={control}
 *   error={errors.clientId}
 * />
 */
export function ClientSelect({ control, error }: ClientSelectProps) {
  // Fetch available clients
  const { clients, loading, error: hookError } = useAvailableClients()

  // Transform clients to SelectOption format
  const options = clients.map((client) => ({
    value: client.id,
    label: client.name,
  }))

  // Determine error to display (RHF error takes priority)
  const displayError = error?.message || hookError || undefined

  return (
    <Controller
      name="clientId"
      control={control}
      render={({ field }) => (
        <SearchableSelect
          ref={field.ref}
          label="Cliente"
          options={options}
          value={field.value || ''}
          onChange={field.onChange}
          loading={loading}
          error={displayError}
          disabled={loading}
          placeholder="Selecciona un cliente..."
        />
      )}
    />
  )
}
