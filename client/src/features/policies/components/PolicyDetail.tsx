import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { DetailLayout } from '../../../shared/components/layout/templates/DetailLayout'
import { DataTable, type Column } from '../../../shared/components/ui/data-display/DataTable'
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
import {
  usePolicyAffiliates,
  usePolicyCounts,
  usePolicyDetail,
} from '../hooks/usePolicies'
import type { PolicyAffiliateResponse, PolicyStatus } from '../policies'
import { POLICY_LIFECYCLE } from '../policyLifecycle'

import { EditPolicyModal } from './EditPolicyModal'
import { StatusTransitionModal } from './StatusTransitionModal'

const TAB_PAGE_LIMIT = 10

export function PolicyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('general')
  const [affiliatePage, setAffiliatePage] = useState(1)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [transitionModalOpen, setTransitionModalOpen] = useState(false)
  const [transitionTarget, setTransitionTarget] = useState<PolicyStatus | null>(null)

  // Main policy data + counts for badges
  const { data: policy, isLoading: policyLoading, error, isError } = usePolicyDetail(id || '')
  const counts = usePolicyCounts(id || '')

  // Tab-specific queries (lazy loaded with enabled conditions)
  const affiliatesQuery = usePolicyAffiliates(id || '', {
    page: affiliatePage,
    limit: TAB_PAGE_LIMIT,
    enabled: activeTab === 'affiliates',
  })

  // Guard: No ID
  if (!id) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Error"
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Pólizas', to: '/polizas' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8">
            <p className="text-red-500 font-medium">ID de póliza no encontrado</p>
            <Button onClick={() => navigate('/polizas')} className="mt-4">
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
            title="Error al Cargar Póliza"
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Pólizas', to: '/polizas' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8 space-y-4">
            <p className="text-red-500 font-medium">Error al cargar póliza</p>
            <p className="text-gray-500 text-sm">
              {error instanceof Error ? error.message : 'Póliza no encontrada'}
            </p>
            <Button onClick={() => navigate('/polizas')}>Volver a la Lista</Button>
          </div>
        </DetailSection>
      </DetailLayout>
    )
  }

  // Loading state
  if (policyLoading || !policy) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Cargando..."
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Pólizas', to: '/polizas' },
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
        </div>
      </DetailLayout>
    )
  }

  // Status transition handler
  const handleStatusTransition = (targetStatus: PolicyStatus) => {
    setTransitionTarget(targetStatus)
    setTransitionModalOpen(true)
  }

  const statusConfig = POLICY_LIFECYCLE[policy.status]

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
      id: 'affiliates',
      label: 'Afiliados',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      badge: counts.affiliates,
    },
  ]

  // Affiliate columns
  const affiliateColumns: Column<PolicyAffiliateResponse>[] = [
    {
      key: 'firstName',
      header: 'Nombre',
      render: (aff) => `${aff.firstName} ${aff.lastName}`,
    },
    { key: 'documentNumber', header: 'Documento' },
    {
      key: 'affiliateType',
      header: 'Tipo',
      render: (aff) => aff.affiliateType === 'OWNER' ? 'Titular' : 'Dependiente',
    },
    {
      key: 'coverageType',
      header: 'Cobertura',
      render: (aff) => {
        if (!aff.coverageType) return '—'
        const map: Record<string, string> = {
          'T': 'T',
          'TPLUS1': 'T+1',
          'TPLUSF': 'T+F',
        }
        return map[aff.coverageType] || aff.coverageType
      },
    },
    {
      key: 'isActive',
      header: 'Estado',
      render: (aff) => (
        <StatusBadge
          label={aff.isActive ? 'Activo' : 'Inactivo'}
          color={aff.isActive ? 'green' : 'gray'}
        />
      ),
    },
  ]

  return (
    <DetailLayout
      header={
        <PageHeader
          title={`Póliza ${policy.policyNumber}`}
          subtitle={`${policy.clientName} - ${policy.insurerName}`}
          breadcrumbs={[
            { label: 'Inicio', to: '/dashboard' },
            { label: 'Pólizas', to: '/polizas' },
            { label: policy.policyNumber },
          ]}
          action={<Button onClick={() => setEditModalOpen(true)}>Editar Póliza</Button>}
        />
      }
      sidebar={<DetailSidebar items={sidebarItems} activeId={activeTab} onSelect={setActiveTab} />}
    >
      {/* General Tab */}
      {activeTab === 'general' && (
        <>
          {/* Workflow Stepper */}
          <WorkflowStepper currentStatus={policy.status} onActionClick={handleStatusTransition} />

          <DetailSection title="Información General">
            <DataGrid columns={3}>
              <DataField label="Número de Póliza" value={policy.policyNumber} />
              <DataField label="Tipo" value={policy.type} />
              <DataField
                label="Estado"
                value={<StatusBadge label={statusConfig.label} color={statusConfig.color} />}
              />

              <DataField label="Cliente" value={policy.clientName} />
              <DataField label="Aseguradora" value={policy.insurerName} />
              <DataField label="Activa" value={policy.isActive ? 'Sí' : 'No'} />

              <DataField label="Fecha de Inicio" value={formatDate(policy.startDate)} />
              <DataField label="Fecha de Fin" value={formatDate(policy.endDate)} />
            </DataGrid>
          </DetailSection>

          <DetailSection title="Cobertura y Costos">
            <DataGrid columns={3}>
              <DataField
                label="Copago Ambulatorio"
                value={policy.ambCopay !== null ? `${policy.ambCopay}%` : null}
              />
              <DataField
                label="Copago Hospitalario"
                value={policy.hospCopay !== null ? `${policy.hospCopay}%` : null}
              />
              <DataField
                label="Cobertura Maternidad"
                value={formatCurrency(policy.maternity)}
              />

              <DataField
                label="Tasa de Impuesto"
                value={policy.taxRate !== null ? `${(policy.taxRate * 100).toFixed(2)}%` : null}
              />
              <DataField
                label="Costos Adicionales"
                value={formatCurrency(policy.additionalCosts)}
              />
            </DataGrid>
          </DetailSection>

          <DetailSection title="Primas">
            <DataGrid columns={3}>
              <DataField label="Prima T" value={formatCurrency(policy.tPremium)} />
              <DataField label="Prima T+1" value={formatCurrency(policy.tplus1Premium)} />
              <DataField label="Prima T+F" value={formatCurrency(policy.tplusfPremium)} />
            </DataGrid>
          </DetailSection>

          {/* Metadata Section */}
          <DetailSection title="Información del Sistema">
            <DataGrid columns={2}>
              <DataField label="Fecha de Creación" value={formatDate(policy.createdAt)} />
              <DataField label="Última Actualización" value={formatDate(policy.updatedAt)} />
            </DataGrid>
          </DetailSection>
        </>
      )}

      {/* Affiliates Tab */}
      {activeTab === 'affiliates' && (
        <DetailSection title="Afiliados de la Póliza">
          <DataTable
            data={affiliatesQuery.data?.affiliates || []}
            columns={affiliateColumns}
            isLoading={affiliatesQuery.isLoading}
            pagination={
              affiliatesQuery.data?.pagination
                ? {
                    ...affiliatesQuery.data.pagination,
                    onPageChange: setAffiliatePage,
                  }
                : undefined
            }
            onRowClick={(aff) => navigate(`/afiliados/${aff.id}`)}
            emptyMessage="Esta póliza no tiene afiliados registrados."
          />
        </DetailSection>
      )}

      {/* Edit Modal */}
      <EditPolicyModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} policyId={policy.id} />

      {/* Status Transition Modal */}
      {transitionTarget && (
        <StatusTransitionModal
          isOpen={transitionModalOpen}
          onClose={() => {
            setTransitionModalOpen(false)
            setTransitionTarget(null)
          }}
          policy={policy}
          targetStatus={transitionTarget}
        />
      )}
    </DetailLayout>
  )
}
