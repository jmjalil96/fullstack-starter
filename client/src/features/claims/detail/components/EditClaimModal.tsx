/**
 * EditClaimModal - Large modal for editing claim fields
 * Shows all fields (editable/locked) organized by 3 sections with 2-column layout
 */

import { Dialog } from '@headlessui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { DateInput } from '../../../../shared/components/form/DateInput'
import { LockedField } from '../../../../shared/components/form/LockedField'
import { ReadOnlyField } from '../../../../shared/components/form/ReadOnlyField'
import { SearchableSelect } from '../../../../shared/components/form/SearchableSelect'
import { Textarea } from '../../../../shared/components/form/Textarea'
import { Button } from '../../../../shared/components/ui/Button'
import { CLAIM_LIFECYCLE, FIELD_LABELS } from '../../../../shared/constants/claimLifecycle'
import { useAvailablePolicies } from '../../../../shared/hooks/claims/useAvailablePolicies'
import { useUpdateClaim } from '../../../../shared/hooks/claims/useUpdateClaim'
import type { ClaimDetailResponse } from '../../../../shared/types/claims'
import { claimUpdateSchema, type ClaimUpdateFormData } from '../schema'

import { EditConfirmationModal, type FieldChange } from './EditConfirmationModal'

/**
 * Props for EditClaimModal component
 */
interface EditClaimModalProps {
  /** Modal open state */
  isOpen: boolean
  /** Close modal callback */
  onClose: () => void
  /** Current claim data */
  claim: ClaimDetailResponse
  /** Callback after successful update (to refetch claim) */
  onSuccess: () => void
}

/**
 * Normalize form values before submission
 * Converts empty strings appropriately based on field type
 */
function normalizeValues(data: Partial<ClaimUpdateFormData>): Partial<ClaimUpdateFormData> {
  // Use Record for dynamic assignment, cast back to proper type at return
  const normalized: Record<string, unknown> = {}

  Object.entries(data).forEach(([key, value]) => {
    // Nullable text fields: '' → null
    if ((key === 'description' || key === 'type') && value === '') {
      normalized[key] = null
    }
    // Date fields: '' → undefined (don't send)
    else if (
      (key === 'incidentDate' || key === 'submittedDate' || key === 'resolvedDate') &&
      value === ''
    ) {
      normalized[key] = undefined
    }
    // Numeric fields: keep as-is (validation handles it)
    else {
      normalized[key] = value
    }
  })

  return normalized as Partial<ClaimUpdateFormData>
}

/**
 * EditClaimModal - Edit claim with strict workflow validation
 *
 * Features:
 * - Large, spacious layout (max-w-4xl)
 * - 3 sections with 2-column layout
 * - Editable fields based on current status (blueprint)
 * - Locked fields shown but disabled with explanation
 * - Policy dropdown with affiliate-specific options
 * - Value normalization before submit
 * - Diff confirmation before save
 * - Prevents close during save
 *
 * @example
 * <EditClaimModal
 *   isOpen={editModalOpen}
 *   onClose={() => setEditModalOpen(false)}
 *   claim={claim}
 *   onSuccess={() => refetch()}
 * />
 */
export function EditClaimModal({ isOpen, onClose, claim, onSuccess }: EditClaimModalProps) {
  // Get editable fields for current status
  const editableFields = CLAIM_LIFECYCLE[claim.status].editableFields

  // Form state
  const form = useForm<ClaimUpdateFormData>({
    resolver: zodResolver(claimUpdateSchema),
    mode: 'onChange',
    defaultValues: {
      description: claim.description ?? undefined,
      amount: claim.amount ?? undefined,
      approvedAmount: claim.approvedAmount ?? undefined,
      policyId: claim.policyId ?? undefined,
      incidentDate: claim.incidentDate ?? undefined,
      submittedDate: claim.submittedDate ?? undefined,
      resolvedDate: claim.resolvedDate ?? undefined,
      type: claim.type ?? undefined,
    },
  })

  const {
    control,
    handleSubmit,
    formState: { dirtyFields },
    getValues,
    reset,
  } = form

  // Reset form with fresh claim data when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        description: claim.description ?? undefined,
        amount: claim.amount ?? undefined,
        approvedAmount: claim.approvedAmount ?? undefined,
        policyId: claim.policyId ?? undefined,
        incidentDate: claim.incidentDate ?? undefined,
        submittedDate: claim.submittedDate ?? undefined,
        resolvedDate: claim.resolvedDate ?? undefined,
        type: claim.type ?? undefined,
      })
    }
  }, [isOpen, claim, reset])

  // Confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [changes, setChanges] = useState<FieldChange[]>([])

  // Hooks
  const { policies, loading: policiesLoading } = useAvailablePolicies(claim.id)
  const { updateClaim, loading: updating } = useUpdateClaim({
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
      .filter((field) => normalized[field as keyof ClaimUpdateFormData] !== undefined)
      .map((field) => ({
        field,
        label: FIELD_LABELS[field as keyof typeof FIELD_LABELS] || field,
        oldValue: claim[field as keyof ClaimDetailResponse],
        newValue: normalized[field as keyof ClaimUpdateFormData],
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
      const typedKey = key as keyof ClaimUpdateFormData
      if (normalized[typedKey] !== undefined) {
        dirtyOnly[key] = normalized[typedKey]
      }
    })

    await updateClaim(claim.id, dirtyOnly)
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
                Editar Reclamo {claim.claimNumber}
              </Dialog.Title>

              <form onSubmit={onSaveClick} className="space-y-8">
                {/* SECTION 1: INFORMACIÓN DEL RECLAMO */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Información del Reclamo
                  </h3>

                  {/* Description - Full Width */}
                  <div className="mb-6">
                    {isEditable('description') ? (
                      <Controller
                        name="description"
                        control={control}
                        render={({ field, fieldState }) => (
                          <Textarea
                            label="Descripción"
                            error={fieldState.error?.message}
                            maxLength={5000}
                            rows={6}
                            {...field}
                            value={field.value ?? ''}
                          />
                        )}
                      />
                    ) : (
                      <LockedField
                        label="Descripción"
                        value={claim.description}
                        reason="Editable en estado SUBMITTED"
                      />
                    )}
                  </div>

                  {/* 2-Column Grid: Type, Dates */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Type */}
                    {isEditable('type') ? (
                      <Controller
                        name="type"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'claim-type-input'
                          return (
                            <div>
                              <label
                                htmlFor={inputId}
                                className="block text-sm font-medium text-[var(--color-navy)] mb-2"
                              >
                                Tipo de Reclamo
                              </label>
                              <input
                                id={inputId}
                                type="text"
                                placeholder="Ej: Consulta médica, Emergencia"
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
                      <LockedField label="Tipo de Reclamo" value={claim.type} reason="Editable en estado SUBMITTED" />
                    )}

                    {/* Incident Date */}
                    {isEditable('incidentDate') ? (
                      <Controller
                        name="incidentDate"
                        control={control}
                        render={({ field, fieldState }) => (
                          <DateInput
                            label="Fecha del Incidente"
                            error={fieldState.error?.message}
                            {...field}
                            value={field.value ?? ''}
                          />
                        )}
                      />
                    ) : (
                      <LockedField
                        label="Fecha del Incidente"
                        value={claim.incidentDate}
                        reason="Editable en estado SUBMITTED"
                      />
                    )}

                    {/* Submitted Date */}
                    {isEditable('submittedDate') ? (
                      <Controller
                        name="submittedDate"
                        control={control}
                        render={({ field, fieldState }) => (
                          <DateInput
                            label="Fecha de Envío"
                            error={fieldState.error?.message}
                            {...field}
                            value={field.value ?? ''}
                          />
                        )}
                      />
                    ) : (
                      <LockedField
                        label="Fecha de Envío"
                        value={claim.submittedDate}
                        reason="Editable en estado SUBMITTED"
                      />
                    )}

                    {/* Resolved Date */}
                    {isEditable('resolvedDate') ? (
                      <Controller
                        name="resolvedDate"
                        control={control}
                        render={({ field, fieldState }) => (
                          <DateInput
                            label="Fecha de Resolución"
                            error={fieldState.error?.message}
                            {...field}
                            value={field.value ?? ''}
                          />
                        )}
                      />
                    ) : (
                      <LockedField
                        label="Fecha de Resolución"
                        value={claim.resolvedDate}
                        reason="Editable en estado EN REVISIÓN"
                      />
                    )}
                  </div>
                </section>

                {/* SECTION 2: MONTOS Y PÓLIZA */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Montos y Póliza
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Amount */}
                    {isEditable('amount') ? (
                      <Controller
                        name="amount"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'claim-amount-input'
                          return (
                            <div>
                              <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
                                Monto Reclamado
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
                      <LockedField
                        label="Monto Reclamado"
                        value={claim.amount}
                        reason="Editable en estado SUBMITTED"
                      />
                    )}

                    {/* Approved Amount */}
                    {isEditable('approvedAmount') ? (
                      <Controller
                        name="approvedAmount"
                        control={control}
                        render={({ field, fieldState }) => {
                          const inputId = 'claim-approved-amount-input'
                          return (
                            <div>
                              <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
                                Monto Aprobado
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
                      <LockedField
                        label="Monto Aprobado"
                        value={claim.approvedAmount}
                        reason="Editable en estado EN REVISIÓN"
                      />
                    )}

                    {/* Policy */}
                    {isEditable('policyId') ? (
                      <Controller
                        name="policyId"
                        control={control}
                        render={({ field, fieldState }) => (
                          <SearchableSelect
                            label="Número de Póliza"
                            value={field.value ?? ''}
                            onChange={(value) => field.onChange(value || null)}
                            options={policies.map((p) => ({
                              value: p.id,
                              label: `${p.policyNumber} — ${p.insurerName}`,
                            }))}
                            placeholder={
                              policiesLoading
                                ? 'Cargando pólizas...'
                                : policies.length === 0
                                  ? 'No hay pólizas disponibles'
                                  : 'Selecciona una póliza'
                            }
                            error={fieldState.error?.message}
                            disabled={policiesLoading}
                            loading={policiesLoading}
                          />
                        )}
                      />
                    ) : (
                      <LockedField
                        label="Número de Póliza"
                        value={claim.policyNumber}
                        reason="Editable en estado SUBMITTED"
                      />
                    )}
                  </div>
                </section>

                {/* SECTION 3: PARTES INVOLUCRADAS */}
                <section>
                  <h3 className="text-lg font-semibold text-[var(--color-navy)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    Partes Involucradas
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <ReadOnlyField label="Cliente" value={claim.clientName} />
                    <ReadOnlyField
                      label="Afiliado Titular"
                      value={`${claim.affiliateFirstName} ${claim.affiliateLastName}`}
                    />
                    <ReadOnlyField
                      label="Paciente"
                      value={`${claim.patientFirstName} ${claim.patientLastName} (${claim.patientRelationship === 'self' ? 'titular' : 'dependiente'})`}
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
