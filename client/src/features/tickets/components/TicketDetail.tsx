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
import { formatDate } from '../../../shared/utils/formatters'
import { useAuthStore } from '../../../store/authStore'
import { useTicketDetail } from '../hooks/useTickets'
import { TICKET_PRIORITY_CONFIG, TICKET_STATUS_CONFIG } from '../ticketLifecycle'

import { MessageBubble } from './MessageBubble'
import { ReplyForm } from './ReplyForm'

export function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'conversacion' | 'detalles'>('conversacion')

  const { data: ticket, isLoading, isError, error } = useTicketDetail(id || '')

  // Guard: No ID
  if (!id) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Error"
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Mis Casos', to: '/casos/mis-casos' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8">
            <p className="text-red-500 font-medium">ID de caso no encontrado</p>
            <Button onClick={() => navigate('/casos/mis-casos')} className="mt-4">
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
            title="Error al Cargar Caso"
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Mis Casos', to: '/casos/mis-casos' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8 space-y-4">
            <p className="text-red-500 font-medium">Error al cargar caso</p>
            <p className="text-gray-500 text-sm">
              {error instanceof Error ? error.message : 'Caso no encontrado'}
            </p>
            <Button onClick={() => navigate('/casos/mis-casos')}>Volver a la Lista</Button>
          </div>
        </DetailSection>
      </DetailLayout>
    )
  }

  // Loading state
  if (isLoading || !ticket) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Cargando..."
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Mis Casos', to: '/casos/mis-casos' },
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

  const statusConfig = TICKET_STATUS_CONFIG[ticket.status]
  const priorityConfig = TICKET_PRIORITY_CONFIG[ticket.priority]
  const isClosed = ticket.status === 'CLOSED'

  // Sidebar items
  const sidebarItems: SidebarItem[] = [
    {
      id: 'conversacion',
      label: 'Conversación',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      badge: ticket.messages.length || undefined,
    },
    {
      id: 'detalles',
      label: 'Detalles',
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

  return (
    <DetailLayout
      header={
        <PageHeader
          title={`Caso ${ticket.ticketNumber}`}
          subtitle={ticket.subject}
          breadcrumbs={[
            { label: 'Inicio', to: '/dashboard' },
            { label: 'Mis Casos', to: '/casos/mis-casos' },
            { label: ticket.ticketNumber },
          ]}
          action={
            <div className="flex gap-2">
              <StatusBadge label={statusConfig.label} color={statusConfig.color} />
              <StatusBadge label={priorityConfig.label} color={priorityConfig.color} />
            </div>
          }
        />
      }
      sidebar={
        <DetailSidebar
          items={sidebarItems}
          activeId={activeTab}
          onSelect={(tabId) => setActiveTab(tabId as 'conversacion' | 'detalles')}
        />
      }
    >
      {/* Conversación Tab */}
      {activeTab === 'conversacion' && (
        <>
          <DetailSection title="Historial de Mensajes">
            {ticket.messages.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="w-12 h-12 mx-auto text-gray-300 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-gray-500">Este caso fue creado sin mensaje inicial.</p>
                <p className="text-gray-400 text-sm mt-1">Escribe el primer mensaje abajo.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ticket.messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwnMessage={msg.authorId === user?.id}
                  />
                ))}
              </div>
            )}
          </DetailSection>

          <DetailSection title="Responder">
            <ReplyForm ticketId={ticket.id} isDisabled={isClosed} />
          </DetailSection>
        </>
      )}

      {/* Detalles Tab */}
      {activeTab === 'detalles' && (
        <>
          <DetailSection title="Información del Caso">
            <DataGrid columns={3}>
              <DataField label="Número de Caso" value={ticket.ticketNumber} />
              <DataField label="Asunto" value={ticket.subject} fullWidth />
              <DataField
                label="Estado"
                value={<StatusBadge label={statusConfig.label} color={statusConfig.color} />}
              />
              <DataField
                label="Prioridad"
                value={<StatusBadge label={priorityConfig.label} color={priorityConfig.color} />}
              />
              <DataField label="Categoría" value={ticket.category} />
            </DataGrid>
          </DetailSection>

          <DetailSection title="Partes Involucradas">
            <DataGrid columns={3}>
              <DataField label="Cliente" value={ticket.clientName} />
              <DataField label="Reportado por" value={ticket.reporterName} />
              <DataField label="Asignado a" value={ticket.assignedToName || 'Sin asignar'} />
              <DataField label="Creado por" value={ticket.createdByName} />
            </DataGrid>
          </DetailSection>

          {ticket.relatedClaimId && (
            <DetailSection title="Reclamo Relacionado">
              <DataGrid columns={2}>
                <DataField
                  label="Número de Reclamo"
                  value={
                    <Link
                      to={`/reclamos/${ticket.relatedClaimId}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {ticket.relatedClaimNumber}
                    </Link>
                  }
                />
              </DataGrid>
            </DetailSection>
          )}

          <DetailSection title="Fechas">
            <DataGrid columns={3}>
              <DataField label="Creado" value={formatDate(ticket.createdAt)} />
              <DataField label="Última Actualización" value={formatDate(ticket.updatedAt)} />
              <DataField label="Cerrado" value={formatDate(ticket.closedAt)} />
            </DataGrid>
          </DetailSection>
        </>
      )}
    </DetailLayout>
  )
}
