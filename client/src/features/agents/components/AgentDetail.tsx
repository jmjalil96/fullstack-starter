import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { DetailLayout } from '../../../shared/components/layout/templates/DetailLayout'
import {
  DataField,
  DataGrid,
  DetailSection,
} from '../../../shared/components/ui/data-display/DetailSection'
import { StatusBadge } from '../../../shared/components/ui/data-display/StatusBadge'
import { Button } from '../../../shared/components/ui/forms/Button'
import { PageHeader } from '../../../shared/components/ui/layout/PageHeader'
import { formatDate } from '../../../shared/utils/formatters'
import { useAgentDetail } from '../hooks/useAgents'

import { EditAgentModal } from './EditAgentModal'

export function AgentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editModalOpen, setEditModalOpen] = useState(false)

  const { data: agent, isLoading, isError, error } = useAgentDetail(id || '')

  // Guard: no ID
  if (!id) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Error"
            breadcrumbs={[
              { label: 'Admin', to: '/admin' },
              { label: 'Agentes', to: '/admin/agentes' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8">
            <p className="text-red-500 font-medium">ID de agente no encontrado</p>
            <Button onClick={() => navigate('/admin/agentes')} className="mt-4">
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
            title="Error al Cargar Agente"
            breadcrumbs={[
              { label: 'Admin', to: '/admin' },
              { label: 'Agentes', to: '/admin/agentes' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8 space-y-4">
            <p className="text-red-500 font-medium">Error al cargar agente</p>
            <p className="text-gray-500 text-sm">
              {error instanceof Error ? error.message : 'Agente no encontrado'}
            </p>
            <Button onClick={() => navigate('/admin/agentes')}>Volver a la Lista</Button>
          </div>
        </DetailSection>
      </DetailLayout>
    )
  }

  // Loading state
  if (isLoading || !agent) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Cargando..."
            breadcrumbs={[
              { label: 'Admin', to: '/admin' },
              { label: 'Agentes', to: '/admin/agentes' },
              { label: 'Cargando...' },
            ]}
          />
        }
        sidebar={<div className="animate-pulse bg-gray-200/50 h-32 rounded-xl" />}
      >
        <div className="space-y-6 animate-pulse">
          <div className="h-20 bg-gray-200/50 rounded-xl" />
          <div className="h-64 bg-gray-200/50 rounded-xl" />
          <div className="h-32 bg-gray-200/50 rounded-xl" />
        </div>
      </DetailLayout>
    )
  }

  const fullName = `${agent.firstName} ${agent.lastName}`

  return (
    <DetailLayout
      header={
        <PageHeader
          title={fullName}
          subtitle={agent.agentCode ? `Código: ${agent.agentCode}` : `ID: ${agent.id}`}
          breadcrumbs={[
            { label: 'Admin', to: '/admin' },
            { label: 'Agentes', to: '/admin/agentes' },
            { label: fullName },
          ]}
          action={
            <Button onClick={() => setEditModalOpen(true)}>
              Editar Agente
            </Button>
          }
        />
      }
      sidebar={<div />}
    >
      {/* Personal Information */}
      <DetailSection title="Información Personal">
        <DataGrid columns={3}>
          <DataField label="Nombre" value={agent.firstName} />
          <DataField label="Apellido" value={agent.lastName} />
          <DataField label="Email" value={agent.email} />
          <DataField label="Teléfono" value={agent.phone || null} />
          <DataField
            label="Estado"
            value={
              <StatusBadge
                label={agent.isActive ? 'Activo' : 'Inactivo'}
                color={agent.isActive ? 'green' : 'gray'}
              />
            }
          />
        </DataGrid>
      </DetailSection>

      {/* Agent Information */}
      <DetailSection title="Información del Agente">
        <DataGrid columns={2}>
          <DataField label="Código de Agente" value={agent.agentCode || null} />
        </DataGrid>
      </DetailSection>

      {/* User Account */}
      <DetailSection title="Cuenta de Usuario">
        <DataGrid columns={2}>
          <DataField
            label="Tiene Cuenta"
            value={
              <StatusBadge
                label={agent.hasUserAccount ? 'Sí' : 'No'}
                color={agent.hasUserAccount ? 'green' : 'gray'}
              />
            }
          />
          <DataField label="ID de Usuario" value={agent.userId || null} />
        </DataGrid>
      </DetailSection>

      {/* System Information */}
      <DetailSection title="Información del Sistema">
        <DataGrid columns={2}>
          <DataField
            label="Fecha de Creación"
            value={formatDate(agent.createdAt)}
          />
          <DataField
            label="Última Actualización"
            value={agent.updatedAt ? formatDate(agent.updatedAt) : null}
          />
        </DataGrid>
      </DetailSection>

      {/* Edit Modal */}
      <EditAgentModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        agentId={agent.id}
      />
    </DetailLayout>
  )
}
