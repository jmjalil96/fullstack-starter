import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAffiliateDetail } from '../../../features/affiliates/hooks/useAffiliates'
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

import { EditAffiliateModal } from './EditAffiliateModal'

// const TAB_PAGE_LIMIT = 10 // For future tab pagination

export function AffiliateDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'general' | 'policies'>('general')
  const [editModalOpen, setEditModalOpen] = useState(false)

  const { data: affiliate, isLoading, isError, error } = useAffiliateDetail(id || '')

  // Guard: no ID
  if (!id) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Error"
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Afiliados', to: '/afiliados' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8">
            <p className="text-red-500 font-medium">ID de afiliado no encontrado</p>
            <Button onClick={() => navigate('/afiliados')} className="mt-4">
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
            title="Error al Cargar Afiliado"
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Afiliados', to: '/afiliados' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8 space-y-4">
            <p className="text-red-500 font-medium">Error al cargar afiliado</p>
            <p className="text-gray-500 text-sm">
              {error instanceof Error ? error.message : 'Afiliado no encontrado'}
            </p>
            <Button onClick={() => navigate('/afiliados')}>Volver a la Lista</Button>
          </div>
        </DetailSection>
      </DetailLayout>
    )
  }

  // Loading state
  if (isLoading || !affiliate) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Cargando..."
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Afiliados', to: '/afiliados' },
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
          <div className="h-32 bg-gray-200/50 rounded-xl" />
        </div>
      </DetailLayout>
    )
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
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: 'policies',
      label: 'Pólizas',
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

  const fullName = `${affiliate.firstName} ${affiliate.lastName}`.trim()

  return (
    <DetailLayout
      header={
        <PageHeader
          title={fullName || 'Afiliado sin nombre'}
          subtitle={
            affiliate.documentNumber ? `Doc: ${affiliate.documentNumber}` : `ID: ${affiliate.id}`
          }
          breadcrumbs={[
            { label: 'Inicio', to: '/dashboard' },
            { label: 'Afiliados', to: '/afiliados' },
            { label: fullName || 'Detalle' },
          ]}
          action={
            <Button onClick={() => setEditModalOpen(true)}>
              Editar Afiliado
            </Button>
          }
        />
      }
      sidebar={
        <DetailSidebar
          items={sidebarItems}
          activeId={activeTab}
          onSelect={(id) => setActiveTab(id as 'general' | 'policies')}
        />
      }
    >
      {/* General Tab */}
      {activeTab === 'general' && (
        <>
          <DetailSection title="Información del Afiliado">
            <DataGrid columns={3}>
              <DataField label="Nombre Completo" value={fullName || '—'} />
              <DataField
                label="Tipo de Afiliado"
                value={affiliate.affiliateType === 'OWNER' ? 'Titular' : 'Dependiente'}
              />
              <DataField
                label="Estado"
                value={
                  <StatusBadge
                    label={affiliate.isActive ? 'Activo' : 'Inactivo'}
                    color={affiliate.isActive ? 'green' : 'gray'}
                  />
                }
              />

              <DataField
                label="Cliente"
                value={
                  <Link
                    to={`/clientes/${affiliate.clientId}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {affiliate.clientName}
                  </Link>
                }
              />
              <DataField
                label="Cobertura"
                value={
                  affiliate.coverageType
                    ? affiliate.coverageType === 'T'
                      ? 'T - Titular'
                      : affiliate.coverageType === 'TPLUS1'
                        ? 'T+1 - Titular + 1'
                        : 'T+F - Titular + Familia'
                    : null
                }
              />
              <DataField
                label="Cuenta de Usuario"
                value={
                  <StatusBadge
                    label={affiliate.hasUserAccount ? 'Sí' : 'No'}
                    color={affiliate.hasUserAccount ? 'blue' : 'gray'}
                  />
                }
              />
            </DataGrid>
          </DetailSection>

          <DetailSection title="Contacto y Documento">
            <DataGrid columns={3}>
              <DataField label="Email" value={affiliate.email || null} />
              <DataField label="Teléfono" value={affiliate.phone || null} />
              <DataField label="Fecha de Nacimiento" value={formatDate(affiliate.dateOfBirth)} />

              <DataField label="Tipo de Documento" value={affiliate.documentType || null} />
              <DataField label="Número de Documento" value={affiliate.documentNumber || null} />
            </DataGrid>
          </DetailSection>

          {(affiliate.affiliateType === 'DEPENDENT' || affiliate.primaryAffiliateId) && (
            <DetailSection title="Relación Familiar">
              <DataGrid columns={2}>
                <DataField
                  label="Afiliado Principal"
                  value={
                    affiliate.primaryAffiliateId ? (
                      <Link
                        to={`/afiliados/${affiliate.primaryAffiliateId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {`${affiliate.primaryAffiliateFirstName ?? ''} ${
                          affiliate.primaryAffiliateLastName ?? ''
                        }`.trim() || 'Ver afiliado principal'}
                      </Link>
                    ) : (
                      '—'
                    )
                  }
                />
              </DataGrid>
            </DetailSection>
          )}

          <DetailSection title="Información del Sistema">
            <DataGrid columns={2}>
              <DataField
                label="Fecha de Creación"
                value={formatDate(affiliate.createdAt)}
              />
              <DataField
                label="Última Actualización"
                value={formatDate(affiliate.updatedAt)}
              />
            </DataGrid>
          </DetailSection>
        </>
      )}

      {/* Policies Tab (placeholder) */}
      {activeTab === 'policies' && (
        <DetailSection title="Pólizas del Afiliado">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-base font-medium text-[var(--color-navy)] mb-2">Pólizas</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">
              Pendiente de implementar
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Aquí se mostrarán las pólizas que cubren a este afiliado.
            </p>
          </div>
        </DetailSection>
      )}

      {/* Edit Modal */}
      <EditAffiliateModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        affiliateId={affiliate.id}
      />
    </DetailLayout>
  )
}
