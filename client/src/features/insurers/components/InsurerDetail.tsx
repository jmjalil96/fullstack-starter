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
import { useInsurerDetail } from '../hooks/useInsurers'

import { EditInsurerModal } from './EditInsurerModal'

export function InsurerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editModalOpen, setEditModalOpen] = useState(false)

  const { data: insurer, isLoading, isError, error } = useInsurerDetail(id || '')

  // Guard: no ID
  if (!id) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Error"
            breadcrumbs={[
              { label: 'Admin', to: '/admin' },
              { label: 'Aseguradoras', to: '/admin/aseguradoras' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8">
            <p className="text-red-500 font-medium">ID de aseguradora no encontrado</p>
            <Button onClick={() => navigate('/admin/aseguradoras')} className="mt-4">
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
            title="Error al Cargar Aseguradora"
            breadcrumbs={[
              { label: 'Admin', to: '/admin' },
              { label: 'Aseguradoras', to: '/admin/aseguradoras' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8 space-y-4">
            <p className="text-red-500 font-medium">Error al cargar aseguradora</p>
            <p className="text-gray-500 text-sm">
              {error instanceof Error ? error.message : 'Aseguradora no encontrada'}
            </p>
            <Button onClick={() => navigate('/admin/aseguradoras')}>Volver a la Lista</Button>
          </div>
        </DetailSection>
      </DetailLayout>
    )
  }

  // Loading state
  if (isLoading || !insurer) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Cargando..."
            breadcrumbs={[
              { label: 'Admin', to: '/admin' },
              { label: 'Aseguradoras', to: '/admin/aseguradoras' },
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

  return (
    <DetailLayout
      header={
        <PageHeader
          title={insurer.name}
          subtitle={insurer.code ? `Código: ${insurer.code}` : `ID: ${insurer.id}`}
          breadcrumbs={[
            { label: 'Admin', to: '/admin' },
            { label: 'Aseguradoras', to: '/admin/aseguradoras' },
            { label: insurer.name },
          ]}
          action={
            <Button onClick={() => setEditModalOpen(true)}>
              Editar Aseguradora
            </Button>
          }
        />
      }
      sidebar={<div />}
    >
      {/* Basic Information */}
      <DetailSection title="Información Básica">
        <DataGrid columns={3}>
          <DataField label="Nombre" value={insurer.name} />
          <DataField label="Código" value={insurer.code || null} />
          <DataField
            label="Estado"
            value={
              <StatusBadge
                label={insurer.isActive ? 'Activo' : 'Inactivo'}
                color={insurer.isActive ? 'green' : 'gray'}
              />
            }
          />
        </DataGrid>
      </DetailSection>

      {/* Contact Information */}
      <DetailSection title="Información de Contacto">
        <DataGrid columns={3}>
          <DataField label="Email" value={insurer.email || null} />
          <DataField label="Teléfono" value={insurer.phone || null} />
          <DataField
            label="Sitio Web"
            value={
              insurer.website ? (
                <a
                  href={insurer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {insurer.website}
                </a>
              ) : null
            }
          />
        </DataGrid>
      </DetailSection>

      {/* System Information */}
      <DetailSection title="Información del Sistema">
        <DataGrid columns={2}>
          <DataField
            label="Fecha de Creación"
            value={formatDate(insurer.createdAt)}
          />
          <DataField
            label="Última Actualización"
            value={formatDate(insurer.updatedAt)}
          />
        </DataGrid>
      </DetailSection>

      {/* Edit Modal */}
      <EditInsurerModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        insurerId={insurer.id}
      />
    </DetailLayout>
  )
}
