/**
 * DescriptionField - Description textarea field for new claim form
 * Connects react-hook-form to Textarea component
 */

import { type FieldError, type UseFormRegister } from 'react-hook-form'

import { Textarea } from '../../../../shared/components/form'
import type { ClaimFormData } from '../schema'

/**
 * Props for DescriptionField component
 */
interface DescriptionFieldProps {
  /** react-hook-form register function */
  register: UseFormRegister<ClaimFormData>
  /** react-hook-form validation error */
  error?: FieldError
  /** Current field value (from watch) for character counter sync */
  value: string
}

/**
 * DescriptionField - Description textarea for new claim
 *
 * Integrates with react-hook-form using register.
 * Always manages the "description" field.
 * Includes character counter (5000 max).
 *
 * @example
 * const { register, watch, formState: { errors } } = useForm<ClaimFormData>()
 * const description = watch('description')
 *
 * <DescriptionField
 *   register={register}
 *   error={errors.description}
 *   value={description}
 * />
 */
export function DescriptionField({ register, error, value }: DescriptionFieldProps) {
  return (
    <Textarea
      label="Descripción del Reclamo"
      {...register('description')}
      value={value}
      maxLength={5000}
      rows={6}
      placeholder="Describe el motivo del reclamo..."
      error={error?.message}
    />
  )
}
