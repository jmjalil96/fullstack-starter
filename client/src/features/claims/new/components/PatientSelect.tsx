/**
 * PatientSelect - Patient selection field for new claim form
 * Connects useAvailablePatients hook to SearchableSelect component
 */

import { Controller, type Control, type FieldError } from 'react-hook-form'

import { SearchableSelect } from '../../../../shared/components/form'
import { useAvailablePatients } from '../../../../shared/hooks/claims'
import type { ClaimFormData } from '../schema'

/**
 * Props for PatientSelect component
 */
interface PatientSelectProps {
  /** react-hook-form control object */
  control: Control<ClaimFormData>
  /** react-hook-form validation error */
  error?: FieldError
  /** Affiliate ID to fetch patients for (from parent form watch) */
  affiliateId: string | null
}

/**
 * PatientSelect - Select patient for new claim
 *
 * Integrates with react-hook-form using Controller.
 * Fetches available patients (affiliate + dependents) when affiliateId is provided.
 * Always manages the "patientId" field.
 * Disabled until affiliate is selected.
 *
 * @example
 * const { control, watch, formState: { errors } } = useForm<ClaimFormData>()
 * const affiliateId = watch('affiliateId')
 *
 * <PatientSelect
 *   control={control}
 *   error={errors.patientId}
 *   affiliateId={affiliateId}
 * />
 */
export function PatientSelect({ control, error, affiliateId }: PatientSelectProps) {
  // Fetch available patients for selected affiliate
  const { patients, loading, error: hookError } = useAvailablePatients(affiliateId)

  // Transform patients to SelectOption format
  // Include relationship in label (Titular/Dependiente)
  const options = patients.map((patient) => ({
    value: patient.id,
    label: `${patient.firstName} ${patient.lastName} (${
      patient.relationship === 'self' ? 'Titular' : 'Dependiente'
    })`,
  }))

  // Determine error to display (RHF error takes priority)
  const displayError = error?.message || hookError || undefined

  return (
    <Controller
      name="patientId"
      control={control}
      render={({ field }) => (
        <SearchableSelect
          ref={field.ref}
          label="Paciente"
          options={options}
          value={field.value || ''}
          onChange={field.onChange}
          loading={loading}
          error={displayError}
          disabled={loading || !affiliateId}
          placeholder="Selecciona un paciente..."
        />
      )}
    />
  )
}
