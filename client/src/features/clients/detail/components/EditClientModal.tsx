/**
 * EditClientModal - Large modal for editing client fields
 * Shows all fields (editable) organized by 3 sections with 2-column layout
 */

import { Dialog } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Textarea } from '../../../../shared/components/form/Textarea'
import { Button } from '../../../../shared/components/ui/Button'
import { useUpdateClient } from '../../../../shared/hooks/clients/useUpdateClient'
import type { ClientDetailResponse } from '../../../../shared/types/clients'
import { clientUpdateSchema, type ClientUpdateFormData } from '../schema'

import { EditConfirmationModal, type FieldChange } from './EditConfirmationModal'

/**
 * Props for EditClientModal component
 */
interface EditClientModalProps {
  /** Modal open state */
  isOpen: boolean
  /** Close modal callback */
  onClose: () => void
  /** Current client data */
  client: ClientDetailResponse
  /** Callback after successful update (to refetch client) */
  onSuccess: () => void
}

/**
 * Field labels for diff display (Spanish)
 */
const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre de la Empresa',
  taxId: 'RUC / Tax ID',
  email: 'Correo Electrónico',
  phone: 'Teléfono',
  address: 'Dirección',
  isActive: 'Estado',
}

/**
 * Normalize form values before submission
 * Converts empty strings appropriately based on field type
 */
function normalizeValues(data: Partial<ClientUpdateFormData>): Partial<ClientUpdateFormData> {
  // Use Record for dynamic assignment, cast back to proper type at return
  const normalized: Record<string, unknown> = {}

  Object.entries(data).forEach(([key, value]) => {
    // Nullable text fields: '' → null
    if ((key === 'email' || key === 'phone' || key === 'address') && value === '') {
      normalized[key] = null
    }
    // Other fields: keep as-is (validation handles it)
    else {
      normalized[key] = value
    }
  })

  return normalized as Partial<ClientUpdateFormData>
}

/**
 * EditClientModal - Edit client with validation
 *
 * Features:
 * - Large, spacious layout (max-w-4xl)
 * - 3 sections with 2-column layout
 * - All fields editable (no lifecycle logic)
 * - Value normalization before submit
 * - Diff confirmation before save
 * - Prevents close during save
 * - Backend error mapping to fields
 *
 * @example
 * <EditClientModal
 *   isOpen={editModalOpen}
 *   onClose={() => setEditModalOpen(false)}
 *   client={client}
 *   onSuccess={() => refetch()}
 * />
 */
export function EditClientModal({ isOpen, onClose, client, onSuccess }: EditClientModalProps) {
  // Form state
  const form = useForm<ClientUpdateFormData>({
    resolver: zodResolver(clientUpdateSchema),
    mode: 'onChange',
    defaultValues: {
      name: client.name ?? undefined,
      taxId: client.taxId ?? undefined,
      email: client.email ?? undefined,
      phone: client.phone ?? undefined,
      address: client.address ?? undefined,
      isActive: client.isActive ?? undefined,
    },
  })

  const {
    control,
    handleSubmit,
    formState: { dirtyFields },
    getValues,
    reset,
  } = form

  // Reset form with fresh client data when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        name: client.name ?? undefined,
        taxId: client.taxId ?? undefined,
        email: client.email ?? undefined,
        phone: client.phone ?? undefined,
        address: client.address ?? undefined,
        isActive: client.isActive ?? undefined,
      })
    }
  }, [isOpen, client, reset])

  // Confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [changes, setChanges] = useState<FieldChange[]>([])

  // Hooks
  const { updateClient, loading: updating } = useUpdateClient({
    onSuccess: () => {
      setConfirmOpen(false)
      onClose()
      onSuccess()
    },
  })

  /**
   * Handle save click - calculate diff and open confirmation
   */
  const onSaveClick = handleSubmit((formData) => {
    // Normalize values
    const normalized = normalizeValues(formData)

    // Calculate changes from dirty fields
    const changedFields: FieldChange[] = Object.keys(dirtyFields)
      .filter((field) => normalized[field as keyof ClientUpdateFormData] !== undefined)
      .map((field) => ({
        field,
        label: FIELD_LABELS[field as keyof typeof FIELD_LABELS] || field,
        oldValue: client[field as keyof ClientDetailResponse],
        newValue: normalized[field as keyof ClientUpdateFormData],
      }))

    // Don't open confirmation if no actual changes
    if (changedFields.length === 0) {
      return
    }

    setChanges(changedFields)
    setConfirmOpen(true)
  })

  /**
   * Handle final confirmation - submit to API
   * Only sends dirty (changed) fields to avoid sending unchanged fields
   */
  const handleConfirmSave = async () => {
    const allValues = getValues()
    const normalized = normalizeValues(allValues)

    // Only send dirty fields (what user actually changed)
    const dirtyOnly: Record<string, unknown> = {}
    Object.keys(dirtyFields).forEach((key) => {
      const typedKey = key as keyof ClientUpdateFormData
      if (normalized[typedKey] !== undefined) {
        dirtyOnly[key] = normalized[typedKey]
      }
    })

    await updateClient(client.id, dirtyOnly)
  }

  return (
    <>
      <Dialog open={isOpen} onClose={updating ? () => {} : onClose}>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 z-40" aria-hidden="true" />

        {/* Panel Container - Scrollable */}
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
              {/* Header */}
              <Dialog.Title className="text-2xl font-bold text-[var(--color-navy)] mb-6">
                Editar Cliente: {client.name}
              </Dialog.Title>

              <form onSubmit={onSaveClick} className="space-y-8">
                {/* SECTION 1: INFORMACIÓN GENERAL */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Información General
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Name */}
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
                              value={field.value ?? ''}
                            />
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                            )}
                          </div>
                        )
                      }}
                    />

                    {/* TaxId */}
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
                              value={field.value ?? ''}
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
                </section>

                {/* SECTION 2: INFORMACIÓN DE CONTACTO */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Información de Contacto
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Email */}
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
                              value={field.value ?? ''}
                            />
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                            )}
                          </div>
                        )
                      }}
                    />

                    {/* Phone */}
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
                              value={field.value ?? ''}
                            />
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                            )}
                          </div>
                        )
                      }}
                    />
                  </div>

                  {/* Address - Full Width */}
                  <div className="mt-6">
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
                          value={field.value ?? ''}
                        />
                      )}
                    />
                  </div>
                </section>

                {/* SECTION 3: ESTADO */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Estado
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* isActive */}
                    <Controller
                      name="isActive"
                      control={control}
                      render={({ field, fieldState }) => {
                        const inputId = 'client-isactive-input'
                        return (
                          <div>
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                id={inputId}
                                type="checkbox"
                                className="w-5 h-5 border-2 border-[var(--color-border)] rounded focus:ring-2 focus:ring-[var(--color-teal)] text-[var(--color-teal)] transition-colors"
                                checked={field.value ?? false}
                                onChange={(e) => field.onChange(e.target.checked)}
                              />
                              <span className="text-sm font-medium text-[var(--color-navy)]">
                                Cliente Activo
                              </span>
                            </label>
                            <p className="mt-1 text-xs text-[var(--color-text-light)] ml-8">
                              Los clientes inactivos no pueden tener nuevas pólizas o afiliados
                            </p>
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                            )}
                          </div>
                        )
                      }}
                    />
                  </div>
                </section>

                {/* Actions */}
                <div className="flex gap-4 pt-6 border-t border-[var(--color-border)]">
                  <Button type="submit" loading={updating} disabled={updating} className="flex-1">
                    Guardar Cambios
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    disabled={updating}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>

      {/* Nested Confirmation Modal */}
      <EditConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        changes={changes}
        onConfirm={handleConfirmSave}
        loading={updating}
      />
    </>
  )
}
