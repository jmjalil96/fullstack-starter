import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { DetailLayout } from '../../../shared/components/layout/templates/DetailLayout'
import {
  DataField,
  DataGrid,
  DetailSection,
} from '../../../shared/components/ui/data-display/DetailSection'
import { StatusBadge } from '../../../shared/components/ui/data-display/StatusBadge'
import { Button } from '../../../shared/components/ui/forms/Button'
import { DetailSidebar, type SidebarItem } from '../../../shared/components/ui/layout/DetailSidebar'
import { PageHeader } from '../../../shared/components/ui/layout/PageHeader'
import { WorkflowStepper } from '../../../shared/components/ui/layout/WorkflowStepper'
import { formatCurrency, formatDate } from '../../../shared/utils/formatters'
import { CARE_TYPE_LABELS, CLAIM_LIFECYCLE, isTerminalState } from '../claimLifecycle'
import type { ClaimAuditLogItem, ClaimInvoiceItem, ClaimStatus } from '../claims'
import { useClaimAuditLogs, useClaimDetail } from '../hooks/useClaims'

import { ClaimFilesTab } from './ClaimFilesTab'
import { ClaimInvoiceModal } from './ClaimInvoiceModal'
import { EditClaimModal } from './EditClaimModal'
import { StatusTransitionModal } from './StatusTransitionModal'

/**
 * Invoice card with kebab menu for edit/delete actions
 */
interface InvoiceCardProps {
  invoice: ClaimInvoiceItem
  canEdit: boolean
  onEdit: (invoice: ClaimInvoiceItem) => void
  onDelete: (invoice: ClaimInvoiceItem) => void
}

function InvoiceCard({ invoice, canEdit, onEdit, onDelete }: InvoiceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--color-navy)]">
            {formatCurrency(invoice.amountSubmitted)}
          </span>
          {canEdit && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label="Opciones de factura"
              >
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                  />
                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-8 z-20 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        onEdit(invoice)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        onDelete(invoice)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600">{invoice.providerName}</p>
      <p className="text-xs text-gray-500 mt-2">
        Subido por {invoice.createdByName} • {formatDate(invoice.createdAt)}
      </p>
    </div>
  )
}

/**
 * Audit log timeline entry component
 */
interface AuditLogEntryProps {
  log: ClaimAuditLogItem
  isLast: boolean
}

function AuditLogEntry({ log, isLast }: AuditLogEntryProps) {
  return (
    <div className="relative flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 bg-[var(--color-navy)] rounded-full mt-1 shrink-0" />
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
      </div>

      {/* Content */}
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">{log.actionLabel}</span>
          <span className="text-xs text-gray-500">
            {new Date(log.createdAt).toLocaleString('es-PA', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {log.userName && (
          <p className="text-xs text-gray-500 mb-2">por {log.userName}</p>
        )}

        {/* Field changes */}
        {log.changes.length > 0 && (
          <div className="space-y-1 mt-2">
            {log.changes.map((change, idx) => (
              <div
                key={`${change.field}-${idx}`}
                className="text-sm bg-gray-50 rounded px-3 py-2 border border-gray-100"
              >
                <span className="font-medium text-gray-700">{change.fieldLabel}:</span>
                {change.oldValue !== null && change.newValue !== null ? (
                  <span className="ml-2 text-gray-600">
                    <span className="line-through text-gray-400">{change.oldValue}</span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className="text-gray-900">{change.newValue}</span>
                  </span>
                ) : change.oldValue !== null ? (
                  <span className="ml-2 text-red-600 line-through">{change.oldValue}</span>
                ) : (
                  <span className="ml-2 text-green-700">{change.newValue}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function ClaimDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('general')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [transitionModalOpen, setTransitionModalOpen] = useState(false)
  const [transitionTarget, setTransitionTarget] = useState<ClaimStatus | null>(null)

  // Invoice modal state
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<ClaimInvoiceItem | null>(null)
  const [invoiceModalMode, setInvoiceModalMode] = useState<'create' | 'edit' | 'delete'>('create')

  // Main claim data
  const { data: claim, isLoading: claimLoading, error, isError } = useClaimDetail(id || '')

  // Audit logs (lazy load when history tab is active)
  const {
    data: auditLogsData,
    isLoading: auditLogsLoading,
  } = useClaimAuditLogs(id || '', { enabled: activeTab === 'history' && !!id })

  // Guard: No ID
  if (!id) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Error"
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Reclamos', to: '/reclamos' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8">
            <p className="text-red-500 font-medium">ID de reclamo no encontrado</p>
            <Button onClick={() => navigate('/reclamos')} className="mt-4">
              Volver a la Lista
            </Button>
          </div>
        </DetailSection>
      </DetailLayout>
    )
  }

  // Error state
  if (isError) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Error al Cargar Reclamo"
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Reclamos', to: '/reclamos' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8 space-y-4">
            <p className="text-red-500 font-medium">Error al cargar reclamo</p>
            <p className="text-gray-500 text-sm">
              {error instanceof Error ? error.message : 'Reclamo no encontrado'}
            </p>
            <Button onClick={() => navigate('/reclamos')}>Volver a la Lista</Button>
          </div>
        </DetailSection>
      </DetailLayout>
    )
  }

  // Loading state
  if (claimLoading || !claim) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Cargando..."
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Reclamos', to: '/reclamos' },
              { label: 'Cargando...' },
            ]}
          />
        }
        sidebar={<div className="animate-pulse bg-gray-200/50 h-32 rounded-xl" />}
      >
        <div className="space-y-6 animate-pulse">
          <div className="h-20 bg-gray-200/50 rounded-xl" />
          <div className="h-64 bg-gray-200/50 rounded-xl" />
          <div className="h-48 bg-gray-200/50 rounded-xl" />
          <div className="h-48 bg-gray-200/50 rounded-xl" />
        </div>
      </DetailLayout>
    )
  }

  // Status transition handler
  const handleStatusTransition = (targetStatus: ClaimStatus) => {
    setTransitionTarget(targetStatus)
    setTransitionModalOpen(true)
  }

  // Invoice modal handlers
  const handleAddInvoice = () => {
    setSelectedInvoice(null)
    setInvoiceModalMode('create')
    setInvoiceModalOpen(true)
  }

  const handleEditInvoice = (invoice: ClaimInvoiceItem) => {
    setSelectedInvoice(invoice)
    setInvoiceModalMode('edit')
    setInvoiceModalOpen(true)
  }

  const handleDeleteInvoice = (invoice: ClaimInvoiceItem) => {
    setSelectedInvoice(invoice)
    setInvoiceModalMode('delete')
    setInvoiceModalOpen(true)
  }

  // Sidebar items
  const sidebarItems: SidebarItem[] = [
    {
      id: 'general',
      label: 'Información General',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: 'invoices',
      label: 'Facturas',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
          />
        </svg>
      ),
      badge: claim.invoices?.length || undefined,
    },
    {
      id: 'history',
      label: 'Historial',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      badge: claim.reprocesses?.length || undefined,
    },
    {
      id: 'files',
      label: 'Archivos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      ),
    },
  ]

  const statusConfig = CLAIM_LIFECYCLE[claim.status]
  const careTypeLabel = claim.careType ? CARE_TYPE_LABELS[claim.careType] : null
  const isSettled = claim.status === 'SETTLED'
  const canEdit = !isTerminalState(claim.status)

  return (
    <DetailLayout
      header={
        <PageHeader
          title={`Reclamo ${claim.claimNumber}`}
          subtitle={`${claim.clientName} - ${claim.affiliateFirstName} ${claim.affiliateLastName}`}
          breadcrumbs={[
            { label: 'Inicio', to: '/dashboard' },
            { label: 'Reclamos', to: '/reclamos' },
            { label: claim.claimNumber },
          ]}
          action={
            canEdit ? (
              <Button onClick={() => setEditModalOpen(true)}>Editar Reclamo</Button>
            ) : undefined
          }
        />
      }
      sidebar={<DetailSidebar items={sidebarItems} activeId={activeTab} onSelect={setActiveTab} />}
    >
      {/* General Tab */}
      {activeTab === 'general' && (
        <>
          {/* Workflow Stepper */}
          <WorkflowStepper
            currentStatus={claim.status}
            onActionClick={handleStatusTransition}
            lifecycle="claim"
          />

          <DetailSection title="Información del Reclamo">
            <DataGrid columns={3}>
              <DataField label="Número de Reclamo" value={claim.claimNumber} />
              <DataField
                label="Tipo de Atención"
                value={
                  careTypeLabel ? (
                    <StatusBadge label={careTypeLabel} color="blue" />
                  ) : null
                }
              />
              <DataField
                label="Estado"
                value={<StatusBadge label={statusConfig.label} color={statusConfig.color} />}
              />

              <DataField label="Fecha de Incurrencia" value={formatDate(claim.incidentDate)} />
              <DataField label="Fecha de Presentación" value={formatDate(claim.submittedDate)} />
              <DataField label="Días Laborables" value={claim.businessDays} />

              <DataField label="Descripción" value={claim.description} fullWidth />
            </DataGrid>
          </DetailSection>

          <DetailSection title="Diagnóstico">
            <DataGrid columns={2}>
              <DataField label="Código Diagnóstico (CIE-10)" value={claim.diagnosisCode} />
              <DataField label="Descripción del Diagnóstico" value={claim.diagnosisDescription} />
            </DataGrid>
          </DetailSection>

          <DetailSection title="Montos">
            <DataGrid columns={3}>
              <DataField label="Monto Presentado" value={formatCurrency(claim.amountSubmitted)} />
              <DataField label="Monto Aprobado" value={formatCurrency(claim.amountApproved)} />
              <DataField
                label="Póliza"
                value={
                  claim.policyId && claim.policyNumber ? (
                    <Link
                      to={`/polizas/${claim.policyId}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {claim.policyNumber}
                    </Link>
                  ) : null
                }
              />
            </DataGrid>
          </DetailSection>

          {/* Settlement Section - Only show when settled */}
          {isSettled && (
            <DetailSection title="Liquidación">
              <DataGrid columns={3}>
                <DataField label="Fecha de Liquidación" value={formatDate(claim.settlementDate)} />
                <DataField label="Número de Liquidación" value={claim.settlementNumber} />
                <DataField label="Gastos No Elegibles" value={formatCurrency(claim.amountDenied)} />
                <DataField label="Gastos No Procesados" value={formatCurrency(claim.amountUnprocessed)} />
                <DataField label="Deducible Aplicado" value={formatCurrency(claim.deductibleApplied)} />
                <DataField label="Copago" value={formatCurrency(claim.copayApplied)} />
              </DataGrid>
              {claim.settlementNotes && (
                <div className="mt-4">
                  <DataField label="Observaciones" value={claim.settlementNotes} fullWidth />
                </div>
              )}
            </DetailSection>
          )}

          <DetailSection title="Partes Involucradas">
            <DataGrid columns={3}>
              <DataField label="Cliente" value={claim.clientName} />
              <DataField
                label="Afiliado"
                value={`${claim.affiliateFirstName} ${claim.affiliateLastName}`}
              />
              <DataField
                label="Paciente"
                value={`${claim.patientFirstName} ${claim.patientLastName}`}
              />
              <DataField
                label="Relación"
                value={
                  <StatusBadge
                    label={claim.patientRelationship === 'self' ? 'Titular' : 'Dependiente'}
                    color={claim.patientRelationship === 'self' ? 'blue' : 'purple'}
                  />
                }
              />
            </DataGrid>
          </DetailSection>

          {/* Metadata Section */}
          <DetailSection title="Información del Sistema">
            <DataGrid columns={2}>
              <DataField label="Creado por" value={claim.createdByName} />
              <DataField label="Fecha de Creación" value={formatDate(claim.createdAt)} />
              <DataField label="Actualizado por" value={claim.updatedByName} />
              <DataField label="Última Actualización" value={formatDate(claim.updatedAt)} />
            </DataGrid>
          </DetailSection>
        </>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <DetailSection title="Facturas Presentadas">
          {/* Total sum row */}
          {claim.invoices && claim.invoices.length > 0 && (
            <div className="mb-4 p-4 bg-[var(--color-navy)]/5 rounded-lg border border-[var(--color-navy)]/10">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  Total ({claim.invoices.length} factura{claim.invoices.length !== 1 ? 's' : ''})
                </span>
                <span className="text-lg font-bold text-[var(--color-navy)]">
                  {formatCurrency(claim.invoices.reduce((sum, inv) => sum + inv.amountSubmitted, 0))}
                </span>
              </div>
            </div>
          )}

          {/* Invoice list */}
          {claim.invoices && claim.invoices.length > 0 ? (
            <div className="space-y-3">
              {claim.invoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  canEdit={canEdit}
                  onEdit={handleEditInvoice}
                  onDelete={handleDeleteInvoice}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay facturas registradas para este reclamo.
            </div>
          )}

          {/* Add Invoice Button */}
          {canEdit && (
            <div className="mt-4">
              <Button variant="outline" onClick={handleAddInvoice} className="w-full">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Agregar Factura
              </Button>
            </div>
          )}
        </DetailSection>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <>
          {/* Reprocess History Section */}
          <DetailSection title="Historial de Reprocesos">
            {claim.reprocesses && claim.reprocesses.length > 0 ? (
              <div className="space-y-3">
                {claim.reprocesses.map((reprocess, index) => (
                  <div
                    key={reprocess.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Reproceso #{index + 1}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(reprocess.reprocessDate)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{reprocess.reprocessDescription}</p>
                    {reprocess.businessDays !== null && (
                      <p className="text-xs text-gray-500 mt-2">
                        Días laborables: {reprocess.businessDays}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay reprocesos registrados para este reclamo.
              </div>
            )}
          </DetailSection>

          {/* Audit Trail */}
          <DetailSection title="Registro de Cambios">
            {auditLogsLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-3 h-3 bg-gray-200 rounded-full mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                      <div className="h-10 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : auditLogsData?.items && auditLogsData.items.length > 0 ? (
              <div>
                {auditLogsData.items.map((log, index) => (
                  <AuditLogEntry
                    key={log.id}
                    log={log}
                    isLast={index === auditLogsData.items.length - 1}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay cambios registrados para este reclamo.
              </div>
            )}
          </DetailSection>
        </>
      )}

      {/* Files Tab */}
      {activeTab === 'files' && <ClaimFilesTab claimId={claim.id} canDelete={canEdit} />}

      {/* Edit Modal */}
      <EditClaimModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} claimId={claim.id} />

      {/* Status Transition Modal */}
      {transitionTarget && (
        <StatusTransitionModal
          isOpen={transitionModalOpen}
          onClose={() => {
            setTransitionModalOpen(false)
            setTransitionTarget(null)
          }}
          claim={claim}
          targetStatus={transitionTarget}
        />
      )}

      {/* Invoice Modal */}
      <ClaimInvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        claimId={claim.id}
        invoice={selectedInvoice}
        mode={invoiceModalMode}
      />
    </DetailLayout>
  )
}
