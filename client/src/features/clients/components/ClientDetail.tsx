import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import type { AffiliateListItemResponse } from '../../../features/affiliates/affiliates'
import {
  useClientAffiliates,
  useClientCounts,
  useClientDetail,
  useClientInvoices,
  useClientPolicies,
} from '../../../features/clients/hooks/useClients'
import { INVOICE_LIFECYCLE } from '../../../features/invoices/invoiceLifecycle'
import type { InvoiceListItemResponse } from '../../../features/invoices/invoices'
import type { PolicyListItemResponse } from '../../../features/policies/policies'
import { POLICY_LIFECYCLE } from '../../../features/policies/policyLifecycle'
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
import { formatCurrency, formatDate } from '../../../shared/utils/formatters'

import { EditClientModal } from './EditClientModal'

const TAB_PAGE_LIMIT = 10

export function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('general')
  const [policyPage, setPolicyPage] = useState(1)
  const [affiliatePage, setAffiliatePage] = useState(1)
  const [invoicePage, setInvoicePage] = useState(1)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Main client data + counts for badges (only run if id exists)
  const { data: client, isLoading: clientLoading, error, isError } = useClientDetail(id || '')
  const counts = useClientCounts(id || '')

  // Tab-specific queries (lazy loaded with enabled conditions)
  const policiesQuery = useClientPolicies(id || '', {
    page: policyPage,
    limit: TAB_PAGE_LIMIT,
    enabled: activeTab === 'policies',
  })
  const affiliatesQuery = useClientAffiliates(id || '', {
    page: affiliatePage,
    limit: TAB_PAGE_LIMIT,
    enabled: activeTab === 'affiliates',
  })
  const invoicesQuery = useClientInvoices(id || '', {
    page: invoicePage,
    limit: TAB_PAGE_LIMIT,
    enabled: activeTab === 'invoices',
  })

  // Guard: Redirect if no ID
  if (!id) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Error"
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Clientes', to: '/clientes' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8">
            <p className="text-red-500 font-medium">ID de cliente no encontrado</p>
            <Button onClick={() => navigate('/clientes')} className="mt-4">
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
            title="Error al Cargar Cliente"
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Clientes', to: '/clientes' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8 space-y-4">
            <p className="text-red-500 font-medium">Error al cargar cliente</p>
            <p className="text-gray-500 text-sm">
              {error instanceof Error ? error.message : 'Cliente no encontrado'}
            </p>
            <Button onClick={() => navigate('/clientes')}>Volver a la Lista</Button>
          </div>
        </DetailSection>
      </DetailLayout>
    )
  }

  // Loading state
  if (clientLoading || !client) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Cargando..."
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Clientes', to: '/clientes' },
              { label: 'Cargando...' },
            ]}
          />
        }
        sidebar={<div className="animate-pulse bg-gray-200/50 h-32 rounded-xl" />}
      >
        <div className="space-y-6 animate-pulse">
          <div className="h-64 bg-gray-200/50 rounded-xl" />
          <div className="h-48 bg-gray-200/50 rounded-xl" />
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
      badge: counts.policies,
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
    {
      id: 'invoices',
      label: 'Facturas',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
          />
        </svg>
      ),
      badge: counts.invoices,
    },
  ]

  // Policy columns
  const policyColumns: Column<PolicyListItemResponse>[] = [
    { key: 'policyNumber', header: 'Nº Póliza' },
    { key: 'type', header: 'Tipo' },
    {
      key: 'status',
      header: 'Estado',
      render: (policy) => {
        const config = POLICY_LIFECYCLE[policy.status]
        return (
          <StatusBadge
            label={config.label}
            color={config.color}
          />
        )
      },
    },
    {
      key: 'startDate',
      header: 'Vigencia',
      render: (policy) => formatDate(policy.startDate) || '—',
    },
  ]

  // Affiliate columns
  const affiliateColumns: Column<AffiliateListItemResponse>[] = [
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

  // Invoice columns
  const invoiceColumns: Column<InvoiceListItemResponse>[] = [
    { key: 'invoiceNumber', header: 'Nº Factura' },
    {
      key: 'totalAmount',
      header: 'Monto',
      render: (inv) => formatCurrency(inv.totalAmount) || '—',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (inv) => {
        const statusConfig = INVOICE_LIFECYCLE[inv.status]
        return <StatusBadge label={statusConfig.label} color={statusConfig.color} />
      },
    },
    {
      key: 'dueDate',
      header: 'Vencimiento',
      render: (inv) => formatDate(inv.dueDate) || '—',
    },
  ]

  return (
    <DetailLayout
      header={
        <PageHeader
          title={client.name}
          subtitle={`RUC: ${client.taxId}`}
          breadcrumbs={[
            { label: 'Inicio', to: '/dashboard' },
            { label: 'Clientes', to: '/clientes' },
            { label: client.name },
          ]}
          action={<Button onClick={() => setEditModalOpen(true)}>Editar Cliente</Button>}
        />
      }
      sidebar={<DetailSidebar items={sidebarItems} activeId={activeTab} onSelect={setActiveTab} />}
    >
      {/* General Tab */}
      {activeTab === 'general' && (
        <>
          <DetailSection title="Información del Cliente">
            <DataGrid columns={3}>
              <DataField label="Razón Social" value={client.name} />
              <DataField label="RUC / DNI" value={client.taxId} />
              <DataField
                label="Estado"
                value={
                  <StatusBadge
                    label={client.isActive ? 'Activo' : 'Inactivo'}
                    color={client.isActive ? 'green' : 'gray'}
                  />
                }
              />

              <DataField label="Email Corporativo" value={client.email} />
              <DataField label="Teléfono" value={client.phone} />

              <DataField label="Dirección Fiscal" value={client.address} fullWidth />
            </DataGrid>
          </DetailSection>

          {/* Metadata Section */}
          <DetailSection title="Información del Sistema">
            <DataGrid columns={2}>
              <DataField label="Fecha de Creación" value={formatDate(client.createdAt)} />
              <DataField label="Última Actualización" value={formatDate(client.updatedAt)} />
            </DataGrid>
          </DetailSection>
        </>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <DetailSection title="Pólizas del Cliente">
          <DataTable
            data={policiesQuery.data?.policies || []}
            columns={policyColumns}
            isLoading={policiesQuery.isLoading}
            pagination={
              policiesQuery.data?.pagination
                ? {
                    ...policiesQuery.data.pagination,
                    onPageChange: setPolicyPage,
                  }
                : undefined
            }
            onRowClick={(policy) => navigate(`/polizas/${policy.id}`)}
            emptyMessage="Este cliente no tiene pólizas registradas."
          />
        </DetailSection>
      )}

      {/* Affiliates Tab */}
      {activeTab === 'affiliates' && (
        <DetailSection title="Afiliados del Cliente">
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
            emptyMessage="Este cliente no tiene afiliados registrados."
          />
        </DetailSection>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <DetailSection title="Facturas del Cliente">
          <DataTable
            data={invoicesQuery.data?.invoices || []}
            columns={invoiceColumns}
            isLoading={invoicesQuery.isLoading}
            pagination={
              invoicesQuery.data?.pagination
                ? {
                    ...invoicesQuery.data.pagination,
                    onPageChange: setInvoicePage,
                  }
                : undefined
            }
            onRowClick={(inv) => navigate(`/facturas/${inv.id}`)}
            emptyMessage="Este cliente no tiene facturas registradas."
          />
        </DetailSection>
      )}

      {/* Edit Modal */}
      <EditClientModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} clientId={client.id} />
    </DetailLayout>
  )
}
