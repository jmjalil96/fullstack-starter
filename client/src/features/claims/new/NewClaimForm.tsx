/**
 * NewClaimForm - Main form for creating a new claim
 */

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { Button } from '../../../shared/components/ui/Button'
import { useCreateClaim } from '../../../shared/hooks/claims'

import { AffiliateSelect, ClientSelect, DescriptionField, PatientSelect } from './components'
import { claimFormSchema, type ClaimFormData } from './schema'

/**
 * NewClaimForm - Complete new claim submission form
 *
 * Features:
 * - Cascading selects (client → affiliate → patient)
 * - Real-time validation
 * - Searchable dropdowns with debouncing
 * - Loading states and error handling
 * - Success/error toasts
 * - Form reset after successful submission
 * - Responsive two-column layout with sticky instructions
 *
 * @example
 * // In NuevoReclamo page
 * <NewClaimForm />
 */
export function NewClaimForm() {
  const navigate = useNavigate()

  // Form setup with real-time validation
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    setFocus,
    reset,
    formState: { errors, isValid },
  } = useForm<ClaimFormData>({
    resolver: zodResolver(claimFormSchema),
    mode: 'onChange', // Real-time validation for submit button state
    defaultValues: {
      clientId: '',
      affiliateId: '',
      patientId: '',
      description: '',
    },
  })

  // Watch for cascading dependencies
  const clientId = watch('clientId')
  const affiliateId = watch('affiliateId')

  // Mutation hook
  const { createClaim, loading } = useCreateClaim()

  // Cascading reset: When clientId changes → clear affiliate and patient
  useEffect(() => {
    if (clientId) {
      setValue('affiliateId', '', { shouldValidate: true })
      setValue('patientId', '', { shouldValidate: true })
    }
  }, [clientId, setValue])

  // Cascading reset: When affiliateId changes → clear patient
  useEffect(() => {
    if (affiliateId) {
      setValue('patientId', '', { shouldValidate: true })
    }
  }, [affiliateId, setValue])

  /**
   * Submit handler with error mapping
   */
  const onSubmit = async (data: ClaimFormData) => {
    try {
      await createClaim(data)
      // Success toast already shown by hook
      reset() // Clear form for next claim
    } catch (error) {
      // Error toast already shown by hook for generic errors

      // Map backend validation errors to fields if available
      if (error instanceof Error) {
        const errorWithMetadata = error as Error & {
          metadata?: {
            issues?: Array<{ path: string; message: string }>
          }
        }

        if (errorWithMetadata.metadata?.issues) {
          const issues = errorWithMetadata.metadata.issues

          issues.forEach((issue) => {
            const fieldName = issue.path as keyof ClaimFormData
            setError(fieldName, {
              type: 'server',
              message: issue.message,
            })
          })

          // Focus first invalid field for quicker correction
          const firstErrorField = issues[0]?.path as keyof ClaimFormData
          if (firstErrorField) {
            setFocus(firstErrorField)
          }
        } else {
          // Non-field error, focus first existing error
          const firstError = Object.keys(errors)[0] as keyof ClaimFormData
          if (firstError) {
            setFocus(firstError)
          }
        }
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Form (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Form Fields */}
          <div className="bg-white border border-[var(--color-border)] rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <svg
                className="w-5 h-5 text-[var(--color-teal)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h2 className="text-lg font-semibold text-[var(--color-navy)]">
                Información del Reclamo
              </h2>
            </div>

            <div className="space-y-4">
              <ClientSelect control={control} error={errors.clientId} />
              <AffiliateSelect control={control} error={errors.affiliateId} clientId={clientId} />
              <PatientSelect control={control} error={errors.patientId} affiliateId={affiliateId} />
              <DescriptionField register={register} error={errors.description} />
            </div>
          </div>

          {/* Card 2: Document Upload Placeholder */}
          <div className="bg-white border border-[var(--color-border)] rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-[var(--color-teal)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 className="text-lg font-semibold text-[var(--color-navy)]">
                Documentos Adjuntos
              </h2>
            </div>

            <div className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-8 text-center">
              <svg
                className="mx-auto h-10 w-10 text-[var(--color-text-light)] mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm text-[var(--color-text-secondary)]">Carga de documentos</p>
              <p className="text-xs text-[var(--color-text-light)] mt-1">Próximamente disponible</p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/reclamos/mis-reclamos')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={loading} disabled={loading || !isValid}>
              Subir Reclamo
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN - Instructions (1/3 width, sticky on desktop, bottom on mobile) */}
        <div className="lg:col-span-1 order-last lg:order-none">
          <div className="lg:sticky lg:top-4">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
              {/* Section 1: Required Documents */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="w-5 h-5 text-[var(--color-teal)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <h3 className="font-semibold text-[var(--color-navy)]">Documentos Necesarios</h3>
                </div>
                <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span>Factura o recibo médico original</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span>Formulario de reclamación (si aplica)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span>Resultados de laboratorio o estudios</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span>Receta médica o prescripción</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span>Orden del médico tratante</span>
                  </li>
                </ul>
              </div>

              {/* Section 2: Guidelines */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="w-5 h-5 text-[var(--color-teal)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="font-semibold text-[var(--color-navy)]">Guías para el Reclamo</h3>
                </div>
                <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span>Describe claramente el motivo de la consulta</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span>Incluye las fechas del servicio médico</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span>Menciona el nombre del proveedor médico</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span>Proporciona detalles que ayuden al procesamiento</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
