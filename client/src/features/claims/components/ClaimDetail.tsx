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
import type { ClaimStatus } from '../claims'
import { useClaimDetail } from '../hooks/useClaims'

import { ClaimFilesTab } from './ClaimFilesTab'
import { EditClaimModal } from './EditClaimModal'
import { StatusTransitionModal } from './StatusTransitionModal'

export function ClaimDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('general')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [transitionModalOpen, setTransitionModalOpen] = useState(false)
  const [transitionTarget, setTransitionTarget] = useState<ClaimStatus | null>(null)

  // Main claim data
  const { data: claim, isLoading: claimLoading, error, isError } = useClaimDetail(id || '')

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

          {/* Reprocesses Section - Only show if there are reprocesses */}
          {claim.reprocesses && claim.reprocesses.length > 0 && (
            <DetailSection title="Historial de Reprocesos">
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
            </DetailSection>
          )}

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
    </DetailLayout>
  )
}
