/**
 * CreateClientModal - Modal for creating a new client
 * Wide layout with 2-column field grid for efficient data entry
 */

import { Dialog } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { ApiRequestError } from '../../../config/api'
import { Textarea } from '../../../shared/components/form/Textarea'
import { Button } from '../../../shared/components/ui/Button'
import { useCreateClient } from '../../../shared/hooks/clients/useCreateClient'

import { clientFormSchema, type ClientFormData } from './schema'

/**
 * Props for CreateClientModal component
 */
interface CreateClientModalProps {
  /** Modal open state */
  isOpen: boolean
  /** Close modal callback */
  onClose: () => void
  /** Callback after successful creation (to refetch list) */
  onSuccess: () => void
}

/**
 * CreateClientModal - Create new client with validation
 *
 * Features:
 * - Wide modal (max-w-3xl) with 2-column field layout
 * - Inline validation with Zod + react-hook-form
 * - Backend error mapping to form fields
 * - Prevents close during save
 * - Auto-close + list refetch on success
 * - Clean form reset on close
 *
 * Layout:
 * - Section 1: Información General (name, taxId)
 * - Section 2: Información de Contacto (email, phone, address)
 * - Actions: Cancel + Submit buttons
 *
 * @example
 * <CreateClientModal
 *   isOpen={modalOpen}
 *   onClose={() => setModalOpen(false)}
 *   onSuccess={() => refetchClients()}
 * />
 */
export function CreateClientModal({ isOpen, onClose, onSuccess }: CreateClientModalProps) {
  // Form state
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    mode: 'onChange', // Real-time validation for button state
    defaultValues: {
      name: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
    },
  })

  const {
    control,
    handleSubmit,
    setError,
    setFocus,
    reset,
    formState: { isValid },
  } = form

  // Create mutation hook
  const { createClient, loading } = useCreateClient()

  // Auto-focus name field when modal opens
  useEffect(() => {
    if (!isOpen) return

    // Small delay to ensure modal is fully rendered
    const timer = setTimeout(() => {
      setFocus('name')
    }, 100)

    return () => clearTimeout(timer)
  }, [isOpen, setFocus])

  /**
   * Handle form submission
   */
  const onSubmit = async (formData: ClientFormData) => {
    try {
      // Convert empty strings to undefined for optional fields
      const cleanedData = {
        name: formData.name,
        taxId: formData.taxId,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
      }

      await createClient(cleanedData)

      // Success: close modal, reset form, parent will refetch
      reset()
      onClose()
      onSuccess()
    } catch (err) {
      // Map backend validation errors to form fields
      if (err instanceof ApiRequestError && err.metadata?.issues) {
        const issues = err.metadata.issues as Array<{ path: string; message: string }>

        issues.forEach((issue) => {
          setError(issue.path as keyof ClientFormData, {
            type: 'server',
            message: issue.message,
          })
        })

        // Focus first invalid field
        if (issues[0]) {
          setFocus(issues[0].path as keyof ClientFormData)
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
              Crear Nuevo Cliente
            </Dialog.Title>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Complete la información del nuevo cliente
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Form Content (scrollable if needed) */}
            <div className="px-6 py-6 max-h-[calc(100vh-250px)] overflow-y-auto">
              <div className="space-y-6">
                {/* SECTION 1: Información General */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Información General
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Name Field */}
                    <Controller
                      name="name"
                      control={control}
                      render={({ field, fieldState }) => {
                        const inputId = 'client-name-input'
                        return (
                          <div>
                            <label
                              htmlFor={inputId}
                              className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                            >
                              Nombre de la Empresa <span className="text-red-500">*</span>
                            </label>
                            <input
                              id={inputId}
                              type="text"
                              placeholder="Ej: TechCorp S.A."
                              maxLength={200}
                              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                              {...field}
                            />
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                            )}
                          </div>
                        )
                      }}
                    />

                    {/* TaxId Field */}
                    <Controller
                      name="taxId"
                      control={control}
                      render={({ field, fieldState }) => {
                        const inputId = 'client-taxid-input'
                        return (
                          <div>
                            <label
                              htmlFor={inputId}
                              className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                            >
                              RUC / Tax ID <span className="text-red-500">*</span>
                            </label>
                            <input
                              id={inputId}
                              type="text"
                              placeholder="Ej: 20123456789"
                              maxLength={20}
                              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                              {...field}
                            />
                            {fieldState.error ? (
                              <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                            ) : (
                              <p className="mt-1 text-xs text-[var(--color-text-light)]">
                                Solo dígitos, 8-20 caracteres
                              </p>
                            )}
                          </div>
                        )
                      }}
                    />
                  </div>
                </div>

                {/* SECTION 2: Información de Contacto */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Información de Contacto
                  </h3>

                  <div className="space-y-4">
                    {/* Email + Phone Row */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Email Field */}
                      <Controller
                        name="email"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'client-email-input'
                          return (
                            <div>
                              <label
                                htmlFor={inputId}
                                className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                              >
                                Correo Electrónico
                              </label>
                              <input
                                id={inputId}
                                type="email"
                                placeholder="correo@empresa.com"
                                maxLength={255}
                                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                                {...field}
                              />
                              {fieldState.error && (
                                <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
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
                          const inputId = 'client-phone-input'
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
                                <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                              )}
                            </div>
                          )
                        }}
                      />
                    </div>

                    {/* Address Field (full width) */}
                    <div>
                      <Controller
                        name="address"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Textarea
                            label="Dirección"
                            placeholder="Dirección completa de la empresa..."
                            rows={3}
                            maxLength={500}
                            error={fieldState.error?.message}
                            {...field}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer: Actions */}
            <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!isValid || loading}
                loading={loading}
              >
                {loading ? 'Creando...' : 'Crear Cliente'}
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
