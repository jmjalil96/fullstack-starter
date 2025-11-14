/**
 * CreateAffiliateModal - Modal for creating a new affiliate
 * Wide layout with 2-column field grid for efficient data entry
 */

import { Dialog } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../../config/api'
import { DateInput } from '../../../shared/components/form/DateInput'
import { Button } from '../../../shared/components/ui/Button'
import { useAvailableClients } from '../../../shared/hooks/affiliates/useAvailableClients'
import { useAvailableOwners } from '../../../shared/hooks/affiliates/useAvailableOwners'
import { useCreateAffiliate } from '../../../shared/hooks/affiliates/useCreateAffiliate'

import { affiliateFormSchema, type AffiliateFormData } from './schema'

/**
 * Props for CreateAffiliateModal component
 */
interface CreateAffiliateModalProps {
  /** Modal open state */
  isOpen: boolean
  /** Close modal callback */
  onClose: () => void
  /** Callback after successful creation (to refetch list) */
  onSuccess?: () => void
}

/**
 * CreateAffiliateModal - Create new affiliate with validation
 *
 * Features:
 * - Wide modal (max-w-3xl) with 2-column field layout
 * - Inline validation with Zod + react-hook-form
 * - Backend error mapping to form fields
 * - Prevents close during save
 * - Auto-close + list refetch on success
 * - Clean form reset on close
 * - Conditional fields based on affiliate type
 * - Dynamic primary affiliate loading based on client selection
 *
 * Layout:
 * - Section 1: Información del Cliente (clientId, affiliateType, primaryAffiliateId)
 * - Section 2: Información Personal (firstName, lastName, email, phone, dateOfBirth)
 * - Section 3: Información de Documento (documentType, documentNumber)
 * - Section 4: Información de Cobertura (coverageType)
 * - Actions: Cancel + Submit buttons
 *
 * @example
 * <CreateAffiliateModal
 *   isOpen={modalOpen}
 *   onClose={() => setModalOpen(false)}
 *   onSuccess={() => refetchAffiliates()}
 * />
 */
export function CreateAffiliateModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateAffiliateModalProps) {
  // Form state
  const form = useForm<AffiliateFormData>({
    resolver: zodResolver(affiliateFormSchema),
    mode: 'onChange', // Real-time validation for button state
    defaultValues: {
      clientId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      documentType: '',
      documentNumber: '',
      affiliateType: 'OWNER',
      coverageType: '',
      primaryAffiliateId: '',
    },
  })

  const {
    control,
    handleSubmit,
    setError,
    setFocus,
    reset,
    watch,
    formState: { isValid },
  } = form

  // Watch clientId and affiliateType for conditional logic
  const selectedClientId = watch('clientId')
  const selectedAffiliateType = watch('affiliateType')

  // Fetch available clients
  const { clients, loading: clientsLoading } = useAvailableClients()

  // Fetch available owners (only when client selected and type is DEPENDENT)
  const shouldFetchOwners = selectedClientId && selectedAffiliateType === 'DEPENDENT'
  const { owners, loading: ownersLoading } = useAvailableOwners(
    shouldFetchOwners ? selectedClientId : null
  )

  // Create mutation hook
  const { createAffiliate, loading } = useCreateAffiliate()

  // Auto-focus clientId field when modal opens
  useEffect(() => {
    if (!isOpen) return

    // Small delay to ensure modal is fully rendered
    const timer = setTimeout(() => {
      setFocus('clientId')
    }, 100)

    return () => clearTimeout(timer)
  }, [isOpen, setFocus])

  /**
   * Handle form submission
   */
  const onSubmit = async (formData: AffiliateFormData) => {
    try {
      // Convert empty strings to undefined for optional fields
      const cleanedData = {
        clientId: formData.clientId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        dateOfBirth: formData.dateOfBirth?.trim() || undefined,
        documentType: formData.documentType?.trim() || undefined,
        documentNumber: formData.documentNumber?.trim() || undefined,
        affiliateType: formData.affiliateType,
        coverageType: (formData.coverageType?.trim() || undefined) as 'T' | 'TPLUS1' | 'TPLUSF' | undefined,
        primaryAffiliateId: formData.primaryAffiliateId?.trim() || undefined,
      }

      await createAffiliate(cleanedData)

      // Success: close modal, reset form, parent will refetch
      reset()
      onClose()
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      // Map backend validation errors to form fields
      if (err instanceof ApiRequestError && err.metadata?.issues) {
        const issues = err.metadata.issues as Array<{ path: string; message: string }>

        issues.forEach((issue) => {
          setError(issue.path as keyof AffiliateFormData, {
            type: 'server',
            message: issue.message,
          })
        })

        // Focus first invalid field
        if (issues[0]) {
          setFocus(issues[0].path as keyof AffiliateFormData)
        }
      }
      // Other errors handled by hook (toast shown)
    }
  }

  /**
   * Handle modal close - prevent during save, reset form
   */
  const handleClose = () => {
    if (loading) return // Prevent close during save
    reset() // Clean form on close
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <Dialog.Title className="text-xl font-semibold text-[var(--color-navy)]">
              Crear Nuevo Afiliado
            </Dialog.Title>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Complete la información del nuevo afiliado
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Form Content (scrollable if needed) */}
            <div className="px-6 py-6 max-h-[calc(100vh-250px)] overflow-y-auto">
              <div className="space-y-6">
                {/* SECTION 1: Información del Cliente */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Información del Cliente
                  </h3>

                  <div className="space-y-4">
                    {/* Cliente Field (full width) */}
                    <Controller
                      name="clientId"
                      control={control}
                      render={({ field, fieldState }) => {
                        const inputId = 'affiliate-client-input'
                        return (
                          <div>
                            <label
                              htmlFor={inputId}
                              className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                            >
                              Cliente <span className="text-red-500">*</span>
                            </label>
                            <select
                              id={inputId}
                              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors"
                              disabled={clientsLoading}
                              {...field}
                            >
                              <option value="">
                                {clientsLoading
                                  ? 'Cargando clientes...'
                                  : 'Selecciona un cliente'}
                              </option>
                              {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                  {client.name}
                                </option>
                              ))}
                            </select>
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-red-600">
                                {fieldState.error.message}
                              </p>
                            )}
                          </div>
                        )
                      }}
                    />

                    {/* Affiliate Type + Primary Affiliate Row */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Tipo de Afiliado Field */}
                      <Controller
                        name="affiliateType"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'affiliate-type-input'
                          return (
                            <div>
                              <label
                                htmlFor={inputId}
                                className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                              >
                                Tipo de Afiliado <span className="text-red-500">*</span>
                              </label>
                              <select
                                id={inputId}
                                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors"
                                {...field}
                              >
                                <option value="OWNER">Titular</option>
                                <option value="DEPENDENT">Dependiente</option>
                              </select>
                              {fieldState.error && (
                                <p className="mt-1 text-xs text-red-600">
                                  {fieldState.error.message}
                                </p>
                              )}
                            </div>
                          )
                        }}
                      />

                      {/* Primary Affiliate Field (conditional) */}
                      {selectedAffiliateType === 'DEPENDENT' && (
                        <Controller
                          name="primaryAffiliateId"
                          control={control}
                          render={({ field, fieldState }) => {
                            const inputId = 'affiliate-primary-input'
                            const isDisabled = !selectedClientId || ownersLoading
                            return (
                              <div>
                                <label
                                  htmlFor={inputId}
                                  className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                                >
                                  Afiliado Principal <span className="text-red-500">*</span>
                                </label>
                                <select
                                  id={inputId}
                                  className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                                  disabled={isDisabled}
                                  {...field}
                                >
                                  <option value="">
                                    {!selectedClientId
                                      ? 'Selecciona un cliente primero'
                                      : ownersLoading
                                        ? 'Cargando titulares...'
                                        : owners.length === 0
                                          ? 'No hay titulares disponibles'
                                          : 'Selecciona un titular'}
                                  </option>
                                  {owners.map((owner) => (
                                    <option key={owner.id} value={owner.id}>
                                      {owner.firstName} {owner.lastName}
                                    </option>
                                  ))}
                                </select>
                                {fieldState.error && (
                                  <p className="mt-1 text-xs text-red-600">
                                    {fieldState.error.message}
                                  </p>
                                )}
                              </div>
                            )
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Información Personal */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Información Personal
                  </h3>

                  <div className="space-y-4">
                    {/* First Name + Last Name Row */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* First Name Field */}
                      <Controller
                        name="firstName"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'affiliate-firstname-input'
                          return (
                            <div>
                              <label
                                htmlFor={inputId}
                                className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                              >
                                Nombre <span className="text-red-500">*</span>
                              </label>
                              <input
                                id={inputId}
                                type="text"
                                placeholder="Ej: Juan"
                                maxLength={100}
                                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                                {...field}
                              />
                              {fieldState.error && (
                                <p className="mt-1 text-xs text-red-600">
                                  {fieldState.error.message}
                                </p>
                              )}
                            </div>
                          )
                        }}
                      />

                      {/* Last Name Field */}
                      <Controller
                        name="lastName"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'affiliate-lastname-input'
                          return (
                            <div>
                              <label
                                htmlFor={inputId}
                                className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                              >
                                Apellido <span className="text-red-500">*</span>
                              </label>
                              <input
                                id={inputId}
                                type="text"
                                placeholder="Ej: Pérez"
                                maxLength={100}
                                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                                {...field}
                              />
                              {fieldState.error && (
                                <p className="mt-1 text-xs text-red-600">
                                  {fieldState.error.message}
                                </p>
                              )}
                            </div>
                          )
                        }}
                      />
                    </div>

                    {/* Email + Phone Row */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Email Field */}
                      <Controller
                        name="email"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'affiliate-email-input'
                          const isRequired = selectedAffiliateType === 'OWNER'
                          return (
                            <div>
                              <label
                                htmlFor={inputId}
                                className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                              >
                                Email {isRequired && <span className="text-red-500">*</span>}
                              </label>
                              <input
                                id={inputId}
                                type="email"
                                placeholder="correo@ejemplo.com"
                                maxLength={255}
                                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                                {...field}
                              />
                              {fieldState.error ? (
                                <p className="mt-1 text-xs text-red-600">
                                  {fieldState.error.message}
                                </p>
                              ) : (
                                isRequired && (
                                  <p className="mt-1 text-xs text-[var(--color-text-light)]">
                                    Requerido para titulares
                                  </p>
                                )
                              )}
                            </div>
                          )
                        }}
                      />

                      {/* Phone Field */}
                      <Controller
                        name="phone"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'affiliate-phone-input'
                          return (
                            <div>
                              <label
                                htmlFor={inputId}
                                className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                              >
                                Teléfono
                              </label>
                              <input
                                id={inputId}
                                type="tel"
                                placeholder="+51-1-1234567"
                                maxLength={20}
                                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                                {...field}
                              />
                              {fieldState.error && (
                                <p className="mt-1 text-xs text-red-600">
                                  {fieldState.error.message}
                                </p>
                              )}
                            </div>
                          )
                        }}
                      />
                    </div>

                    {/* Date of Birth Field */}
                    <div className="grid grid-cols-2 gap-4">
                      <Controller
                        name="dateOfBirth"
                        control={control}
                        render={({ field, fieldState }) => (
                          <DateInput
                            label="Fecha de Nacimiento"
                            error={fieldState.error?.message}
                            {...field}
                            value={field.value ?? ''}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Información de Documento */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Información de Documento
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Document Type Field */}
                    <Controller
                      name="documentType"
                      control={control}
                      render={({ field, fieldState }) => {
                        const inputId = 'affiliate-doctype-input'
                        return (
                          <div>
                            <label
                              htmlFor={inputId}
                              className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                            >
                              Tipo de Documento
                            </label>
                            <input
                              id={inputId}
                              type="text"
                              placeholder="Ej: DNI, Pasaporte"
                              maxLength={50}
                              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                              {...field}
                            />
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-red-600">
                                {fieldState.error.message}
                              </p>
                            )}
                          </div>
                        )
                      }}
                    />

                    {/* Document Number Field */}
                    <Controller
                      name="documentNumber"
                      control={control}
                      render={({ field, fieldState }) => {
                        const inputId = 'affiliate-docnumber-input'
                        return (
                          <div>
                            <label
                              htmlFor={inputId}
                              className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                            >
                              Número de Documento
                            </label>
                            <input
                              id={inputId}
                              type="text"
                              placeholder="Ej: 12345678"
                              maxLength={50}
                              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                              {...field}
                            />
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-red-600">
                                {fieldState.error.message}
                              </p>
                            )}
                          </div>
                        )
                      }}
                    />
                  </div>
                </div>

                {/* SECTION 4: Información de Cobertura */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Información de Cobertura
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Coverage Type Field */}
                    <Controller
                      name="coverageType"
                      control={control}
                      render={({ field, fieldState }) => {
                        const inputId = 'affiliate-coverage-input'
                        return (
                          <div>
                            <label
                              htmlFor={inputId}
                              className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                            >
                              Tipo de Cobertura
                            </label>
                            <select
                              id={inputId}
                              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors"
                              {...field}
                            >
                              <option value="">Selecciona un tipo</option>
                              <option value="T">T - Titular</option>
                              <option value="TPLUS1">TPLUS1 - Titular + 1</option>
                              <option value="TPLUSF">TPLUSF - Titular + Familia</option>
                            </select>
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-red-600">
                                {fieldState.error.message}
                              </p>
                            )}
                          </div>
                        )
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer: Actions */}
            <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={!isValid || loading} loading={loading}>
                {loading ? 'Creando...' : 'Crear Afiliado'}
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
