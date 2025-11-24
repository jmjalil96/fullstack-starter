import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { DetailLayout } from '../../shared/components/layout/templates/DetailLayout'
import {
  DataField,
  DataGrid,
  DetailSection,
} from '../../shared/components/ui/data-display/DetailSection'
import { StatusBadge } from '../../shared/components/ui/data-display/StatusBadge'
import { Button } from '../../shared/components/ui/forms/Button'
import { DetailSidebar, type SidebarItem } from '../../shared/components/ui/layout/DetailSidebar'
import { PageHeader } from '../../shared/components/ui/layout/PageHeader'
import { WorkflowStepper } from '../../shared/components/ui/layout/WorkflowStepper'
import { CLAIM_LIFECYCLE } from '../../shared/constants/claimLifecycle'
import { useClaimDetail } from '../../shared/hooks/claims/useClaims'
import type { ClaimStatus } from '../../shared/types/claims'
import { formatCurrency, formatDate } from '../../shared/utils/formatters'

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
  ]

  const statusConfig = CLAIM_LIFECYCLE[claim.status]

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
          action={<Button onClick={() => setEditModalOpen(true)}>Editar Reclamo</Button>}
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
              <DataField label="Tipo" value={claim.type} />
              <DataField
                label="Estado"
                value={<StatusBadge label={statusConfig.label} color={statusConfig.color} />}
              />

              <DataField label="Fecha del Incidente" value={formatDate(claim.incidentDate)} />
              <DataField label="Fecha de Envío" value={formatDate(claim.submittedDate)} />
              <DataField label="Fecha de Resolución" value={formatDate(claim.resolvedDate)} />

              <DataField label="Descripción" value={claim.description} fullWidth />
            </DataGrid>
          </DetailSection>

          <DetailSection title="Montos y Póliza">
            <DataGrid columns={3}>
              <DataField label="Monto Reclamado" value={formatCurrency(claim.amount)} />
              <DataField label="Monto Aprobado" value={formatCurrency(claim.approvedAmount)} />
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
              <DataField label="Última Actualización" value={formatDate(claim.updatedAt)} />
            </DataGrid>
          </DetailSection>
        </>
      )}

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
