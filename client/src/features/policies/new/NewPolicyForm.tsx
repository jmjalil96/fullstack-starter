/**
 * NewPolicyForm - Main form for creating a new policy
 */

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import { ApiRequestError } from '../../../config/api'
import { DateInput } from '../../../shared/components/form/DateInput'
import { Button } from '../../../shared/components/ui/Button'
import { useCreatePolicy } from '../../../shared/hooks/policies'

import { ClientSelect, InsurerSelect } from './components'
import { policyFormSchema, type PolicyFormData } from './schema'

/**
 * NewPolicyForm - Complete new policy submission form
 *
 * Features:
 * - Client and insurer selection dropdowns
 * - Policy number input (auto-uppercased)
 * - Optional type field
 * - Date range validation (end must be after start)
 * - Real-time validation with field-level errors
 * - Loading states and error handling
 * - Success navigation to policy detail page
 * - Responsive two-column layout with instructions
 *
 * @example
 * // In NuevaPoliza page
 * <NewPolicyForm />
 */
export function NewPolicyForm() {
  const navigate = useNavigate()

  // Form setup with real-time validation
  const {
    control,
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isValid },
  } = useForm<PolicyFormData>({
    resolver: zodResolver(policyFormSchema),
    mode: 'onChange', // Real-time validation for submit button state
    defaultValues: {
      policyNumber: '',
      clientId: '',
      insurerId: '',
      type: '',
      startDate: '',
      endDate: '',
    },
  })

  // Mutation hook
  const { createPolicy, loading } = useCreatePolicy()

  /**
   * Submit handler with error mapping
   */
  const onSubmit = async (data: PolicyFormData) => {
    try {
      const policy = await createPolicy(data)
      // Success toast already shown by hook
      // Navigate to policy detail page
      navigate(`/clientes/polizas/${policy.id}`)
    } catch (error) {
      // Map backend validation errors to fields if available
      if (error instanceof ApiRequestError && error.metadata?.issues) {
        const issues = error.metadata.issues as Array<{ path: string; message: string }>

        issues.forEach((issue) => {
          const fieldName = issue.path as keyof PolicyFormData
          setError(fieldName, {
            type: 'server',
            message: issue.message,
          })
        })

        // Focus first invalid field for quicker correction
        if (issues[0]) {
          setFocus(issues[0].path as keyof PolicyFormData)
        }
      }
      // Generic errors already toasted by hook, no additional handling needed
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Form (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Form Fields */}
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 className="text-lg font-semibold text-[var(--color-navy)]">
                Información de la Póliza
              </h2>
            </div>

            <div className="space-y-4">
              {/* Row 1: Client and Insurer (2 columns on desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ClientSelect control={control} error={errors.clientId} />
                <InsurerSelect control={control} error={errors.insurerId} />
              </div>

              {/* Row 2: Policy Number and Type (2 columns on desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Policy Number */}
                <div>
                  <label
                    htmlFor="policyNumber"
                    className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                  >
                    Número de Póliza
                  </label>
                  <input
                    {...register('policyNumber')}
                    id="policyNumber"
                    type="text"
                    placeholder="Ej: POL-2024-001"
                    className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors uppercase disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
                    disabled={loading}
                    aria-invalid={!!errors.policyNumber}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.policyNumber && (
                    <p className="mt-1 text-xs text-red-600" role="alert">
                      {errors.policyNumber.message}
                    </p>
                  )}
                </div>

                {/* Type (Optional) */}
                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                  >
                    Tipo de Póliza <span className="text-[var(--color-text-light)]">(Opcional)</span>
                  </label>
                  <input
                    {...register('type')}
                    id="type"
                    type="text"
                    placeholder="Ej: Salud, Vida, etc."
                    className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
                    disabled={loading}
                    aria-invalid={!!errors.type}
                  />
                  {errors.type && (
                    <p className="mt-1 text-xs text-red-600" role="alert">
                      {errors.type.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Start Date and End Date (2 columns on desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field, fieldState }) => (
                    <DateInput
                      label="Fecha de Inicio"
                      error={fieldState.error?.message}
                      disabled={loading}
                      {...field}
                    />
                  )}
                />

                <Controller
                  name="endDate"
                  control={control}
                  render={({ field, fieldState }) => (
                    <DateInput
                      label="Fecha de Fin"
                      error={fieldState.error?.message}
                      disabled={loading}
                      {...field}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={loading} disabled={loading || !isValid}>
              Crear Póliza
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN - Instructions (1/3 width, sticky on desktop, bottom on mobile) */}
        <div className="lg:col-span-1 order-last lg:order-none">
          <div className="lg:sticky lg:top-4">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6">
              {/* Section 1: What is a Policy */}
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="font-semibold text-[var(--color-navy)]">Sobre las Pólizas</h3>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                  Una póliza es el contrato de seguro que vincula a un cliente con una aseguradora
                  específica. Define la cobertura, el período de vigencia y los términos del seguro.
                </p>
              </div>

              {/* Section 2: Required Fields */}
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
                  <h3 className="font-semibold text-[var(--color-navy)]">Campos Requeridos</h3>
                </div>
                <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span><strong>Cliente:</strong> Empresa u organización asegurada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span><strong>Aseguradora:</strong> Compañía de seguros proveedora</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span><strong>Número de Póliza:</strong> Identificador único</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span><strong>Fechas:</strong> Período de vigencia de la cobertura</span>
                  </li>
                </ul>
              </div>

              {/* Section 3: Guidelines */}
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
                  <h3 className="font-semibold text-[var(--color-navy)]">Recomendaciones</h3>
                </div>
                <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span>Verifica que el número de póliza sea correcto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span>Asegúrate de que las fechas coincidan con el contrato</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span>El tipo de póliza ayuda a clasificar y buscar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--color-teal)] mt-0.5">•</span>
                    <span>Las pólizas se activan automáticamente en su fecha de inicio</span>
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
