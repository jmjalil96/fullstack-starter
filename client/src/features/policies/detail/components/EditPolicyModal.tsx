/**
 * EditPolicyModal - Large modal for editing policy fields
 * Shows all 14 fields (editable/locked) organized by 5 sections with 2-column layout
 */

import { Dialog } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { DateInput } from '../../../../shared/components/form/DateInput'
import { ReadOnlyField } from '../../../../shared/components/form/ReadOnlyField'
import { SearchableSelect } from '../../../../shared/components/form/SearchableSelect'
import { Button } from '../../../../shared/components/ui/Button'
import { FIELD_LABELS, POLICY_LIFECYCLE } from '../../../../shared/constants/policyLifecycle'
import { useAvailableClients } from '../../../../shared/hooks/policies/useAvailableClients'
import { useAvailableInsurers } from '../../../../shared/hooks/policies/useAvailableInsurers'
import { useUpdatePolicy } from '../../../../shared/hooks/policies/useUpdatePolicy'
import type { PolicyDetailResponse } from '../../../../shared/types/policies'
import { policyUpdateSchema, type PolicyEditFormData } from '../schema'

import { EditConfirmationModal, type FieldChange } from './EditConfirmationModal'

/**
 * Props for EditPolicyModal component
 */
interface EditPolicyModalProps {
  /** Modal open state */
  isOpen: boolean
  /** Close modal callback */
  onClose: () => void
  /** Current policy data */
  policy: PolicyDetailResponse
  /** Callback after successful update (to refetch policy) */
  onSuccess: () => void
}

/**
 * Normalize form values before submission
 * Converts empty strings appropriately based on field type
 */
function normalizeValues(data: Partial<PolicyEditFormData>): Partial<PolicyEditFormData> {
  // Use Record for dynamic assignment, cast back to proper type at return
  const normalized: Record<string, unknown> = {}

  Object.entries(data).forEach(([key, value]) => {
    // Nullable text fields: '' → null
    if (key === 'type' && value === '') {
      normalized[key] = null
    }
    // Date fields: '' → undefined (don't send)
    else if ((key === 'startDate' || key === 'endDate') && value === '') {
      normalized[key] = undefined
    }
    // Numeric fields: keep as-is (validation handles it)
    else {
      normalized[key] = value
    }
  })

  return normalized as Partial<PolicyEditFormData>
}

/**
 * EditPolicyModal - Edit policy with strict workflow validation
 *
 * Features:
 * - Large, spacious layout (max-w-4xl)
 * - 5 sections with 2-column layout
 * - Editable fields based on current status (blueprint)
 * - Locked fields shown but disabled with explanation
 * - Client/Insurer dropdowns with searchable selects
 * - Value normalization before submit
 * - Diff confirmation before save
 * - Prevents close during save
 *
 * @example
 * <EditPolicyModal
 *   isOpen={editModalOpen}
 *   onClose={() => setEditModalOpen(false)}
 *   policy={policy}
 *   onSuccess={() => refetch()}
 * />
 */
export function EditPolicyModal({ isOpen, onClose, policy, onSuccess }: EditPolicyModalProps) {
  // Get editable fields for current status
  const editableFields = POLICY_LIFECYCLE[policy.status].editableFields

  // Form state
  const form = useForm<PolicyEditFormData>({
    resolver: zodResolver(policyUpdateSchema),
    mode: 'onChange',
    defaultValues: {
      policyNumber: policy.policyNumber ?? undefined,
      clientId: policy.clientId ?? undefined,
      insurerId: policy.insurerId ?? undefined,
      type: policy.type ?? undefined,
      ambCopay: policy.ambCopay ?? undefined,
      hospCopay: policy.hospCopay ?? undefined,
      maternity: policy.maternity ?? undefined,
      tPremium: policy.tPremium ?? undefined,
      tplus1Premium: policy.tplus1Premium ?? undefined,
      tplusfPremium: policy.tplusfPremium ?? undefined,
      taxRate: policy.taxRate ?? undefined,
      additionalCosts: policy.additionalCosts ?? undefined,
      startDate: policy.startDate ?? undefined,
      endDate: policy.endDate ?? undefined,
    },
  })

  const {
    control,
    handleSubmit,
    formState: { dirtyFields },
    getValues,
    reset,
  } = form

  // Reset form with fresh policy data when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        policyNumber: policy.policyNumber ?? undefined,
        clientId: policy.clientId ?? undefined,
        insurerId: policy.insurerId ?? undefined,
        type: policy.type ?? undefined,
        ambCopay: policy.ambCopay ?? undefined,
        hospCopay: policy.hospCopay ?? undefined,
        maternity: policy.maternity ?? undefined,
        tPremium: policy.tPremium ?? undefined,
        tplus1Premium: policy.tplus1Premium ?? undefined,
        tplusfPremium: policy.tplusfPremium ?? undefined,
        taxRate: policy.taxRate ?? undefined,
        additionalCosts: policy.additionalCosts ?? undefined,
        startDate: policy.startDate ?? undefined,
        endDate: policy.endDate ?? undefined,
      })
    }
  }, [isOpen, policy, reset])

  // Confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [changes, setChanges] = useState<FieldChange[]>([])

  // Hooks
  const { clients, loading: clientsLoading } = useAvailableClients()
  const { insurers, loading: insurersLoading } = useAvailableInsurers()
  const { updatePolicy, loading: updating } = useUpdatePolicy({
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
      .filter((field) => normalized[field as keyof PolicyEditFormData] !== undefined)
      .map((field) => ({
        field: field as keyof typeof FIELD_LABELS,
        oldValue: policy[field as keyof PolicyDetailResponse],
        newValue: normalized[field as keyof PolicyEditFormData],
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
   * Only sends dirty (changed) fields to avoid sending locked fields
   */
  const handleConfirmSave = async () => {
    const allValues = getValues()
    const normalized = normalizeValues(allValues)

    // Only send dirty fields (what user actually changed)
    const dirtyOnly: Record<string, unknown> = {}
    Object.keys(dirtyFields).forEach((key) => {
      const typedKey = key as keyof PolicyEditFormData
      if (normalized[typedKey] !== undefined) {
        dirtyOnly[key] = normalized[typedKey]
      }
    })

    await updatePolicy(policy.id, dirtyOnly)
  }

  /**
   * Check if field is editable in current status
   */
  const isEditable = (field: string): boolean => {
    return (editableFields as readonly string[]).includes(field)
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
                Editar Póliza {policy.policyNumber}
              </Dialog.Title>

              <form onSubmit={onSaveClick} className="space-y-8">
                {/* SECTION 1: INFORMACIÓN BÁSICA */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Información Básica
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Policy Number */}
                    {isEditable('policyNumber') ? (
                      <Controller
                        name="policyNumber"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'policy-number-input'
                          return (
                            <div>
                              <label
                                htmlFor={inputId}
                                className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                              >
                                Número de Póliza
                              </label>
                              <input
                                id={inputId}
                                type="text"
                                placeholder="Ej: POL-2025-001"
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
                    ) : (
                      <ReadOnlyField label="Número de Póliza" value={policy.policyNumber} />
                    )}

                    {/* Type */}
                    {isEditable('type') ? (
                      <Controller
                        name="type"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'policy-type-input'
                          return (
                            <div>
                              <label
                                htmlFor={inputId}
                                className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                              >
                                Tipo de Póliza
                              </label>
                              <input
                                id={inputId}
                                type="text"
                                placeholder="Ej: Salud, Vida, Dental"
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
                    ) : (
                      <ReadOnlyField label="Tipo de Póliza" value={policy.type} />
                    )}
                  </div>
                </section>

                {/* SECTION 2: COBERTURA Y COPAGOS */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Cobertura y Copagos
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Ambulatory Copay */}
                    {isEditable('ambCopay') ? (
                      <Controller
                        name="ambCopay"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'policy-amb-copay-input'
                          return (
                            <div>
                              <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
                                Copago Ambulatorio
                              </label>
                              <input
                                id={inputId}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                                }
                              />
                              {fieldState.error && (
                                <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                              )}
                            </div>
                          )
                        }}
                      />
                    ) : (
                      <ReadOnlyField
                        label="Copago Ambulatorio"
                        value={policy.ambCopay}
                        formatter={(v) => (v !== null && v !== undefined ? `${v as number}%` : '—')}
                      />
                    )}

                    {/* Hospital Copay */}
                    {isEditable('hospCopay') ? (
                      <Controller
                        name="hospCopay"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'policy-hosp-copay-input'
                          return (
                            <div>
                              <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
                                Copago Hospitalario
                              </label>
                              <input
                                id={inputId}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                                }
                              />
                              {fieldState.error && (
                                <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                              )}
                            </div>
                          )
                        }}
                      />
                    ) : (
                      <ReadOnlyField
                        label="Copago Hospitalario"
                        value={policy.hospCopay}
                        formatter={(v) => (v !== null && v !== undefined ? `${v as number}%` : '—')}
                      />
                    )}

                    {/* Maternity */}
                    {isEditable('maternity') ? (
                      <Controller
                        name="maternity"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'policy-maternity-input'
                          return (
                            <div>
                              <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
                                Cobertura Maternidad
                              </label>
                              <input
                                id={inputId}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                                }
                              />
                              {fieldState.error && (
                                <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                              )}
                            </div>
                          )
                        }}
                      />
                    ) : (
                      <ReadOnlyField
                        label="Cobertura Maternidad"
                        value={policy.maternity}
                        formatter={(v) =>
                          v !== null && v !== undefined
                            ? new Intl.NumberFormat('es-ES', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(v as number)
                            : '—'
                        }
                      />
                    )}
                  </div>
                </section>

                {/* SECTION 3: PRIMAS */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Primas por Nivel
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* T Premium */}
                    {isEditable('tPremium') ? (
                      <Controller
                        name="tPremium"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'policy-t-premium-input'
                          return (
                            <div>
                              <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
                                Prima T (Titular)
                              </label>
                              <input
                                id={inputId}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                                }
                              />
                              {fieldState.error && (
                                <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                              )}
                            </div>
                          )
                        }}
                      />
                    ) : (
                      <ReadOnlyField
                        label="Prima T (Titular)"
                        value={policy.tPremium}
                        formatter={(v) =>
                          v !== null && v !== undefined
                            ? new Intl.NumberFormat('es-ES', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(v as number)
                            : '—'
                        }
                      />
                    )}

                    {/* T+1 Premium */}
                    {isEditable('tplus1Premium') ? (
                      <Controller
                        name="tplus1Premium"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'policy-tplus1-premium-input'
                          return (
                            <div>
                              <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
                                Prima T+1 (Titular + 1)
                              </label>
                              <input
                                id={inputId}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                                }
                              />
                              {fieldState.error && (
                                <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                              )}
                            </div>
                          )
                        }}
                      />
                    ) : (
                      <ReadOnlyField
                        label="Prima T+1 (Titular + 1)"
                        value={policy.tplus1Premium}
                        formatter={(v) =>
                          v !== null && v !== undefined
                            ? new Intl.NumberFormat('es-ES', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(v as number)
                            : '—'
                        }
                      />
                    )}

                    {/* T+F Premium */}
                    {isEditable('tplusfPremium') ? (
                      <Controller
                        name="tplusfPremium"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'policy-tplusf-premium-input'
                          return (
                            <div>
                              <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
                                Prima T+F (Familiar)
                              </label>
                              <input
                                id={inputId}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                                }
                              />
                              {fieldState.error && (
                                <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                              )}
                            </div>
                          )
                        }}
                      />
                    ) : (
                      <ReadOnlyField
                        label="Prima T+F (Familiar)"
                        value={policy.tplusfPremium}
                        formatter={(v) =>
                          v !== null && v !== undefined
                            ? new Intl.NumberFormat('es-ES', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(v as number)
                            : '—'
                        }
                      />
                    )}
                  </div>
                </section>

                {/* SECTION 4: COSTOS */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Costos Adicionales
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Tax Rate */}
                    {isEditable('taxRate') ? (
                      <Controller
                        name="taxRate"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'policy-tax-rate-input'
                          return (
                            <div>
                              <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
                                Tasa de Impuesto (decimal)
                              </label>
                              <input
                                id={inputId}
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                placeholder="0.16"
                                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                                }
                              />
                              {fieldState.error && (
                                <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                              )}
                            </div>
                          )
                        }}
                      />
                    ) : (
                      <ReadOnlyField
                        label="Tasa de Impuesto"
                        value={policy.taxRate}
                        formatter={(v) => (v !== null && v !== undefined ? `${((v as number) * 100).toFixed(2)}%` : '—')}
                      />
                    )}

                    {/* Additional Costs */}
                    {isEditable('additionalCosts') ? (
                      <Controller
                        name="additionalCosts"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'policy-additional-costs-input'
                          return (
                            <div>
                              <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
                                Costos Adicionales
                              </label>
                              <input
                                id={inputId}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors placeholder:text-gray-400"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))
                                }
                              />
                              {fieldState.error && (
                                <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>
                              )}
                            </div>
                          )
                        }}
                      />
                    ) : (
                      <ReadOnlyField
                        label="Costos Adicionales"
                        value={policy.additionalCosts}
                        formatter={(v) =>
                          v !== null && v !== undefined
                            ? new Intl.NumberFormat('es-ES', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(v as number)
                            : '—'
                        }
                      />
                    )}
                  </div>
                </section>

                {/* SECTION 5: FECHAS Y RELACIONES */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Fechas y Relaciones
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Start Date */}
                    {isEditable('startDate') ? (
                      <Controller
                        name="startDate"
                        control={control}
                        render={({ field, fieldState }) => (
                          <DateInput
                            label="Fecha de Inicio"
                            error={fieldState.error?.message}
                            {...field}
                            value={field.value ?? ''}
                          />
                        )}
                      />
                    ) : (
                      <ReadOnlyField
                        label="Fecha de Inicio"
                        value={policy.startDate}
                        formatter={(v) => {
                          if (typeof v === 'string') {
                            const d = new Date(v)
                            if (!Number.isNaN(d.getTime())) {
                              return d.toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              })
                            }
                          }
                          return '—'
                        }}
                      />
                    )}

                    {/* End Date */}
                    {isEditable('endDate') ? (
                      <Controller
                        name="endDate"
                        control={control}
                        render={({ field, fieldState }) => (
                          <DateInput
                            label="Fecha de Fin"
                            error={fieldState.error?.message}
                            {...field}
                            value={field.value ?? ''}
                          />
                        )}
                      />
                    ) : (
                      <ReadOnlyField
                        label="Fecha de Fin"
                        value={policy.endDate}
                        formatter={(v) => {
                          if (typeof v === 'string') {
                            const d = new Date(v)
                            if (!Number.isNaN(d.getTime())) {
                              return d.toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              })
                            }
                          }
                          return '—'
                        }}
                      />
                    )}

                    {/* Client */}
                    {isEditable('clientId') ? (
                      <Controller
                        name="clientId"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SearchableSelect
                            label="Cliente"
                            value={field.value ?? ''}
                            onChange={(value) => field.onChange(value || null)}
                            options={clients.map((c) => ({
                              value: c.id,
                              label: c.name,
                            }))}
                            placeholder={
                              clientsLoading
                                ? 'Cargando clientes...'
                                : clients.length === 0
                                  ? 'No hay clientes disponibles'
                                  : 'Selecciona un cliente'
                            }
                            error={fieldState.error?.message}
                            disabled={clientsLoading}
                            loading={clientsLoading}
                          />
                        )}
                      />
                    ) : (
                      <ReadOnlyField label="Cliente" value={policy.clientName} />
                    )}

                    {/* Insurer */}
                    {isEditable('insurerId') ? (
                      <Controller
                        name="insurerId"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SearchableSelect
                            label="Aseguradora"
                            value={field.value ?? ''}
                            onChange={(value) => field.onChange(value || null)}
                            options={insurers.map((i) => ({
                              value: i.id,
                              label: i.code ? `${i.name} (${i.code})` : i.name,
                            }))}
                            placeholder={
                              insurersLoading
                                ? 'Cargando aseguradoras...'
                                : insurers.length === 0
                                  ? 'No hay aseguradoras disponibles'
                                  : 'Selecciona una aseguradora'
                            }
                            error={fieldState.error?.message}
                            disabled={insurersLoading}
                            loading={insurersLoading}
                          />
                        )}
                      />
                    ) : (
                      <ReadOnlyField label="Aseguradora" value={policy.insurerName} />
                    )}
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
