/**
 * EditAffiliateModal - Large modal for editing affiliate fields
 * Shows all fields (editable) organized by 3 sections with 2-column layout
 */

import { Dialog } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { DateInput } from '../../../../shared/components/form/DateInput'
import { SearchableSelect } from '../../../../shared/components/form/SearchableSelect'
import { Button } from '../../../../shared/components/ui/Button'
import { useAvailableOwners } from '../../../../shared/hooks/affiliates/useAvailableOwners'
import { useUpdateAffiliate } from '../../../../shared/hooks/affiliates/useUpdateAffiliate'
import type { AffiliateDetailResponse } from '../../../../shared/types/affiliates'
import { affiliateUpdateSchema, type AffiliateUpdateFormData } from '../schema'

import { EditConfirmationModal, type FieldChange } from './EditConfirmationModal'

/**
 * Props for EditAffiliateModal component
 */
interface EditAffiliateModalProps {
  /** Modal open state */
  isOpen: boolean
  /** Close modal callback */
  onClose: () => void
  /** Current affiliate data */
  affiliate: AffiliateDetailResponse
  /** Callback after successful update (to refetch affiliate) */
  onSuccess?: () => void
}

/**
 * Field labels for diff display (Spanish)
 */
const FIELD_LABELS: Record<string, string> = {
  firstName: 'Nombre',
  lastName: 'Apellido',
  email: 'Correo Electrónico',
  phone: 'Teléfono',
  dateOfBirth: 'Fecha de Nacimiento',
  documentType: 'Tipo de Documento',
  documentNumber: 'Número de Documento',
  affiliateType: 'Tipo de Afiliado',
  coverageType: 'Tipo de Cobertura',
  primaryAffiliateId: 'Afiliado Principal',
  isActive: 'Estado',
}

/**
 * Normalize form values before submission
 * Converts empty strings appropriately based on field type
 */
function normalizeValues(data: Partial<AffiliateUpdateFormData>): Partial<AffiliateUpdateFormData> {
  // Use Record for dynamic assignment, cast back to proper type at return
  const normalized: Record<string, unknown> = {}

  Object.entries(data).forEach(([key, value]) => {
    // Nullable text fields: '' → null
    if (
      (key === 'email' ||
        key === 'phone' ||
        key === 'dateOfBirth' ||
        key === 'documentType' ||
        key === 'documentNumber' ||
        key === 'coverageType' ||
        key === 'primaryAffiliateId') &&
      value === ''
    ) {
      normalized[key] = null
    }
    // Other fields: keep as-is (validation handles it)
    else {
      normalized[key] = value
    }
  })

  return normalized as Partial<AffiliateUpdateFormData>
}

/**
 * EditAffiliateModal - Edit affiliate with validation
 *
 * Features:
 * - Large, spacious layout (max-w-4xl)
 * - 3 sections with 2-column layout
 * - All fields editable (with type-dependent logic)
 * - Value normalization before submit
 * - Diff confirmation before save
 * - Prevents close during save
 * - Backend error mapping to fields
 * - Conditional primaryAffiliateId based on affiliateType
 *
 * @example
 * <EditAffiliateModal
 *   isOpen={editModalOpen}
 *   onClose={() => setEditModalOpen(false)}
 *   affiliate={affiliate}
 *   onSuccess={() => refetch()}
 * />
 */
export function EditAffiliateModal({
  isOpen,
  onClose,
  affiliate,
  onSuccess,
}: EditAffiliateModalProps) {
  // Form state
  const form = useForm<AffiliateUpdateFormData>({
    resolver: zodResolver(affiliateUpdateSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: affiliate.firstName ?? undefined,
      lastName: affiliate.lastName ?? undefined,
      email: affiliate.email ?? undefined,
      phone: affiliate.phone ?? undefined,
      dateOfBirth: affiliate.dateOfBirth ?? undefined,
      documentType: affiliate.documentType ?? undefined,
      documentNumber: affiliate.documentNumber ?? undefined,
      affiliateType: affiliate.affiliateType ?? undefined,
      coverageType: affiliate.coverageType ?? undefined,
      primaryAffiliateId: affiliate.primaryAffiliateId ?? undefined,
      isActive: affiliate.isActive ?? undefined,
    },
  })

  const {
    control,
    handleSubmit,
    formState: { dirtyFields },
    getValues,
    reset,
    watch,
  } = form

  // Watch affiliateType to conditionally show primaryAffiliateId
  const watchedAffiliateType = watch('affiliateType')

  // Fetch available owners only when affiliateType is DEPENDENT
  const { owners, loading: loadingOwners } = useAvailableOwners(
    watchedAffiliateType === 'DEPENDENT' ? affiliate.clientId : null
  )

  // Reset form with fresh affiliate data when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        firstName: affiliate.firstName ?? undefined,
        lastName: affiliate.lastName ?? undefined,
        email: affiliate.email ?? undefined,
        phone: affiliate.phone ?? undefined,
        dateOfBirth: affiliate.dateOfBirth ?? undefined,
        documentType: affiliate.documentType ?? undefined,
        documentNumber: affiliate.documentNumber ?? undefined,
        affiliateType: affiliate.affiliateType ?? undefined,
        coverageType: affiliate.coverageType ?? undefined,
        primaryAffiliateId: affiliate.primaryAffiliateId ?? undefined,
        isActive: affiliate.isActive ?? undefined,
      })
    }
  }, [isOpen, affiliate, reset])

  // Confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [changes, setChanges] = useState<FieldChange[]>([])

  // Hooks
  const { updateAffiliate, loading: updating } = useUpdateAffiliate({
    onSuccess: () => {
      setConfirmOpen(false)
      onClose()
      if (onSuccess) {
        onSuccess()
      }
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
      .filter((field) => normalized[field as keyof AffiliateUpdateFormData] !== undefined)
      .map((field) => {
        const fieldKey = field as keyof AffiliateUpdateFormData
        let oldValue = affiliate[field as keyof AffiliateDetailResponse]
        let newValue = normalized[fieldKey]

        // Special handling for primaryAffiliateId - display full name instead of ID
        if (field === 'primaryAffiliateId') {
          // Old value
          if (oldValue) {
            oldValue = `${affiliate.primaryAffiliateFirstName ?? ''} ${affiliate.primaryAffiliateLastName ?? ''}`.trim() || oldValue
          }
          // New value
          if (newValue && typeof newValue === 'string') {
            const owner = owners.find((o) => o.id === newValue)
            if (owner) {
              newValue = `${owner.firstName} ${owner.lastName}`.trim()
            }
          }
        }

        return {
          field,
          label: FIELD_LABELS[fieldKey] || field,
          oldValue,
          newValue,
        }
      })

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
      const typedKey = key as keyof AffiliateUpdateFormData
      if (normalized[typedKey] !== undefined) {
        dirtyOnly[key] = normalized[typedKey]
      }
    })

    await updateAffiliate(affiliate.id, dirtyOnly)
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
                Editar Afiliado: {affiliate.firstName} {affiliate.lastName}
              </Dialog.Title>

              <form onSubmit={onSaveClick} className="space-y-8">
                {/* SECTION 1: INFORMACIÓN PERSONAL */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Información Personal
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* First Name */}
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
                              value={field.value ?? ''}
                            />
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                            )}
                          </div>
                        )
                      }}
                    />

                    {/* Last Name */}
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
                              value={field.value ?? ''}
                            />
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                            )}
                          </div>
                        )
                      }}
                    />

                    {/* Email */}
                    <Controller
                      name="email"
                      control={control}
                      render={({ field, fieldState }) => {
                        const inputId = 'affiliate-email-input'
                        return (
                          <div>
                            <label
                              htmlFor={inputId}
                              className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                            >
                              Correo Electrónico
                              {watchedAffiliateType === 'OWNER' && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>
                            <input
                              id={inputId}
                              type="email"
                              placeholder="correo@ejemplo.com"
                              maxLength={255}
                              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                              {...field}
                              value={field.value ?? ''}
                            />
                            {fieldState.error ? (
                              <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                            ) : watchedAffiliateType === 'OWNER' ? (
                              <p className="mt-1 text-xs text-[var(--color-text-light)]">
                                Obligatorio para afiliados titulares
                              </p>
                            ) : null}
                          </div>
                        )
                      }}
                    />

                    {/* Phone */}
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
                              value={field.value ?? ''}
                            />
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                            )}
                          </div>
                        )
                      }}
                    />

                    {/* Date of Birth */}
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

                    {/* Document Type */}
                    <Controller
                      name="documentType"
                      control={control}
                      render={({ field, fieldState }) => {
                        const inputId = 'affiliate-documenttype-input'
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
                              placeholder="Ej: DNI, Pasaporte, RUC"
                              maxLength={50}
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

                    {/* Document Number */}
                    <Controller
                      name="documentNumber"
                      control={control}
                      render={({ field, fieldState }) => {
                        const inputId = 'affiliate-documentnumber-input'
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
                </section>

                {/* SECTION 2: TIPO Y COBERTURA */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Tipo y Cobertura
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Affiliate Type */}
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
                              value={field.value ?? ''}
                            >
                              <option value="">Seleccionar...</option>
                              <option value="OWNER">Titular (OWNER)</option>
                              <option value="DEPENDENT">Dependiente (DEPENDENT)</option>
                            </select>
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                            )}
                          </div>
                        )
                      }}
                    />

                    {/* Coverage Type */}
                    <Controller
                      name="coverageType"
                      control={control}
                      render={({ field, fieldState }) => {
                        const inputId = 'affiliate-coveragetype-input'
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
                              value={field.value ?? ''}
                            >
                              <option value="">Seleccionar...</option>
                              <option value="T">T (Solo)</option>
                              <option value="TPLUS1">TPLUS1 (Pareja)</option>
                              <option value="TPLUSF">TPLUSF (Familia)</option>
                            </select>
                            {fieldState.error && (
                              <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                            )}
                          </div>
                        )
                      }}
                    />

                    {/* Primary Affiliate (conditional - only for DEPENDENT) */}
                    {watchedAffiliateType === 'DEPENDENT' && (
                      <Controller
                        name="primaryAffiliateId"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SearchableSelect
                            label="Afiliado Principal"
                            options={owners.map((owner) => ({
                              value: owner.id,
                              label: `${owner.firstName} ${owner.lastName}${owner.documentNumber ? ` (${owner.documentNumber})` : ''}`,
                            }))}
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            loading={loadingOwners}
                            error={fieldState.error?.message}
                            placeholder="Buscar titular..."
                          />
                        )}
                      />
                    )}
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
                        const inputId = 'affiliate-isactive-input'
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
                                Afiliado Activo
                              </span>
                            </label>
                            <p className="mt-1 text-xs text-[var(--color-text-light)] ml-8">
                              Los afiliados inactivos no pueden tener nuevas pólizas
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
