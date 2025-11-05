/**
 * AffiliateSelect - Affiliate selection field for new claim form
 * Connects useAvailableAffiliates hook to SearchableSelect component
 */

import { Controller, type Control, type FieldError } from 'react-hook-form'

import { SearchableSelect } from '../../../../shared/components/form'
import { useAvailableAffiliates } from '../../../../shared/hooks/claims'
import type { ClaimFormData } from '../schema'

/**
 * Props for AffiliateSelect component
 */
interface AffiliateSelectProps {
  /** react-hook-form control object */
  control: Control<ClaimFormData>
  /** react-hook-form validation error */
  error?: FieldError
  /** Client ID to fetch affiliates for (from parent form watch) */
  clientId: string | null
}

/**
 * AffiliateSelect - Select affiliate (titular) for new claim
 *
 * Integrates with react-hook-form using Controller.
 * Fetches available affiliates when clientId is provided.
 * Always manages the "affiliateId" field.
 * Disabled until client is selected.
 *
 * @example
 * const { control, watch, formState: { errors } } = useForm<ClaimFormData>()
 * const clientId = watch('clientId')
 *
 * <AffiliateSelect
 *   control={control}
 *   error={errors.affiliateId}
 *   clientId={clientId}
 * />
 */
export function AffiliateSelect({ control, error, clientId }: AffiliateSelectProps) {
  // Fetch available affiliates for selected client
  const { affiliates, loading, error: hookError } = useAvailableAffiliates(clientId)

  // Transform affiliates to SelectOption format
  // Include coverageType in label if available
  const options = affiliates.map((affiliate) => ({
    value: affiliate.id,
    label: `${affiliate.firstName} ${affiliate.lastName}${
      affiliate.coverageType ? ` (${affiliate.coverageType})` : ''
    }`,
  }))

  // Determine error to display (RHF error takes priority)
  const displayError = error?.message || hookError || undefined

  return (
    <Controller
      name="affiliateId"
      control={control}
      render={({ field }) => (
        <SearchableSelect
          ref={field.ref}
          label="Afiliado Titular"
          options={options}
          value={field.value || ''}
          onChange={field.onChange}
          loading={loading}
          error={displayError}
          disabled={loading || !clientId}
          placeholder="Selecciona un afiliado..."
        />
      )}
    />
  )
}
