import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { DetailLayout } from '../../shared/components/layout/templates/DetailLayout'
import { DataTable } from '../../shared/components/ui/data-display/DataTable'
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
import { INVOICE_LIFECYCLE } from '../../shared/constants/invoiceLifecycle'
import { useInvoiceDetail } from '../../shared/hooks/invoices/useInvoices'
import type { InvoicePolicyDetail, InvoiceStatus } from '../../shared/types/invoices'
import { formatCurrency, formatDate } from '../../shared/utils/formatters'

import { EditInvoiceModal } from './EditInvoiceModal'
import { StatusTransitionModal } from './StatusTransitionModal'
import { ValidateInvoiceModal } from './ValidateInvoiceModal'

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'general' | 'policies'>('general')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [transitionModalOpen, setTransitionModalOpen] = useState(false)
  const [transitionTarget, setTransitionTarget] = useState<InvoiceStatus | null>(null)
  const [validateModalOpen, setValidateModalOpen] = useState(false)

  const { data: invoice, isLoading, isError, error } = useInvoiceDetail(id || '')

  // Guard: No ID
  if (!id) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Error"
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Facturas', to: '/facturas' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8">
            <p className="text-red-500 font-medium">ID de factura no encontrado</p>
            <Button onClick={() => navigate('/facturas')} className="mt-4">
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
            title="Error al Cargar Factura"
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Facturas', to: '/facturas' },
              { label: 'Error' },
            ]}
          />
        }
        sidebar={<div />}
      >
        <DetailSection title="Error">
          <div className="text-center py-8 space-y-4">
            <p className="text-red-500 font-medium">Error al cargar factura</p>
            <p className="text-gray-500 text-sm">
              {error instanceof Error ? error.message : 'Factura no encontrada'}
            </p>
            <Button onClick={() => navigate('/facturas')}>Volver a la Lista</Button>
          </div>
        </DetailSection>
      </DetailLayout>
    )
  }

  // Loading state
  if (isLoading || !invoice) {
    return (
      <DetailLayout
        header={
          <PageHeader
            title="Cargando..."
            breadcrumbs={[
              { label: 'Inicio', to: '/dashboard' },
              { label: 'Facturas', to: '/facturas' },
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

  const statusConfig = INVOICE_LIFECYCLE[invoice.status]

  // Status transition handler
  const handleStatusTransition = (targetStatus: InvoiceStatus) => {
    setTransitionTarget(targetStatus)
    setTransitionModalOpen(true)
  }

  // Helper: Render tier breakdown from expectedBreakdown JSON
  const renderTierBreakdown = (
    policy: InvoicePolicyDetail,
    tier: 'T' | 'TPLUS1' | 'TPLUSF'
  ) => {
    const breakdown = policy.expectedBreakdown as Record<string, { fullPeriod: number; proRated: number }>
    const tierData = breakdown?.[tier]
    if (!tierData || (tierData.fullPeriod === 0 && tierData.proRated === 0)) return '—'

    const total = tierData.fullPeriod + tierData.proRated
    return (
      <div className="text-sm">
        <div className="font-medium">{total}</div>
        {tierData.proRated > 0 && (
          <div className="text-xs text-gray-500">
            {tierData.fullPeriod} + {tierData.proRated} prorr.
          </div>
        )}
      </div>
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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
      badge: invoice.policies.length || undefined,
    },
  ]

  return (
    <DetailLayout
      header={
        <PageHeader
          title={`Factura ${invoice.invoiceNumber}`}
          subtitle={`${invoice.clientName} · ${invoice.insurerName}`}
          breadcrumbs={[
            { label: 'Inicio', to: '/dashboard' },
            { label: 'Facturas', to: '/facturas' },
            { label: invoice.invoiceNumber },
          ]}
          action={
            <div className="flex gap-2">
              {invoice.status === 'PENDING' && (
                <Button variant="primary" onClick={() => setValidateModalOpen(true)}>
                  Validar Factura
                </Button>
              )}
              <Button onClick={() => setEditModalOpen(true)}>Editar Factura</Button>
            </div>
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
          {/* WorkflowStepper */}
          <WorkflowStepper
            currentStatus={invoice.status}
            onActionClick={handleStatusTransition}
            lifecycle="invoice"
          />

          <DetailSection title="Información General">
            <DataGrid columns={3}>
              <DataField label="Número de Factura" value={invoice.invoiceNumber} />
              <DataField label="Factura Aseguradora" value={invoice.insurerInvoiceNumber} />
              <DataField label="Período de Facturación" value={invoice.billingPeriod || null} />

              <DataField
                label="Cliente"
                value={
                  invoice.clientId ? (
                    <Link
                      to={`/clientes/${invoice.clientId}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {invoice.clientName}
                    </Link>
                  ) : (
                    invoice.clientName
                  )
                }
              />
              <DataField
                label="Aseguradora"
                value={invoice.insurerName}
              />
              <DataField
                label="Estado"
                value={<StatusBadge label={statusConfig.label} color={statusConfig.color} />}
              />

              <DataField
                label="Estado de Pago"
                value={
                  <StatusBadge
                    label={invoice.paymentStatus === 'PAID' ? 'Pagada' : 'Pendiente de Pago'}
                    color={invoice.paymentStatus === 'PAID' ? 'green' : 'yellow'}
                  />
                }
              />
            </DataGrid>
          </DetailSection>

          <DetailSection title="Montos y Validación">
            <DataGrid columns={3}>
              <DataField label="Monto Total" value={formatCurrency(invoice.totalAmount)} />
              <DataField label="Impuestos" value={formatCurrency(invoice.taxAmount)} />
              <DataField label="Monto Esperado" value={formatCurrency(invoice.expectedAmount)} />

              <DataField
                label="Afiliados Facturados"
                value={
                  invoice.actualAffiliateCount !== null
                    ? invoice.actualAffiliateCount.toLocaleString('es-EC')
                    : null
                }
              />
              <DataField
                label="Afiliados Esperados"
                value={
                  invoice.expectedAffiliateCount !== null
                    ? invoice.expectedAffiliateCount.toLocaleString('es-EC')
                    : null
                }
              />
              <DataField
                label="Coincidencia de Afiliados"
                value={
                  invoice.countMatches === null
                    ? null
                    : invoice.countMatches
                      ? 'Coinciden'
                      : 'No coinciden'
                }
              />

              <DataField
                label="Coincidencia de Monto"
                value={
                  invoice.amountMatches === null
                    ? null
                    : invoice.amountMatches
                      ? 'Coinciden'
                      : 'No coinciden'
                }
              />
              <DataField
                label="Notas de Discrepancia"
                value={invoice.discrepancyNotes}
                fullWidth
              />
            </DataGrid>
          </DetailSection>

          <DetailSection title="Fechas y Auditoría">
            <DataGrid columns={3}>
              <DataField label="Fecha de Emisión" value={formatDate(invoice.issueDate)} />
              <DataField label="Fecha de Vencimiento" value={formatDate(invoice.dueDate)} />
              <DataField label="Fecha de Pago" value={formatDate(invoice.paymentDate)} />

              <DataField label="Subida por" value={invoice.uploadedByName} />
              <DataField label="Fecha de Subida" value={formatDate(invoice.uploadedAt)} />
              <DataField label="Creada el" value={formatDate(invoice.createdAt)} />
              <DataField label="Última Actualización" value={formatDate(invoice.updatedAt)} />
            </DataGrid>
          </DetailSection>
        </>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <DetailSection title="Pólizas Asociadas">
          <DataTable
            data={(invoice.policies || []).map((p) => ({ ...p, id: p.policyId }))}
            columns={[
              {
                key: 'policyNumber',
                header: 'Nº Póliza',
                render: (p) => (
                  <Link
                    to={`/polizas/${p.policyId}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {p.policyNumber}
                  </Link>
                ),
              },
              {
                key: 'expectedAffiliateCount',
                header: 'Total',
                align: 'center',
                render: (p) => p.expectedAffiliateCount,
              },
              {
                key: 'tierT',
                header: 'T',
                align: 'center',
                render: (p) => renderTierBreakdown(p, 'T'),
              },
              {
                key: 'tierTPLUS1',
                header: 'T+1',
                align: 'center',
                render: (p) => renderTierBreakdown(p, 'TPLUS1'),
              },
              {
                key: 'tierTPLUSF',
                header: 'T+F',
                align: 'center',
                render: (p) => renderTierBreakdown(p, 'TPLUSF'),
              },
              {
                key: 'expectedAmount',
                header: 'Monto Esperado',
                align: 'right',
                render: (p) => formatCurrency(p.expectedAmount),
              },
              {
                key: 'addedAt',
                header: 'Agregada',
                align: 'right',
                render: (p) => formatDate(p.addedAt),
              },
            ]}
            isLoading={false}
            onRowClick={(policy) => navigate(`/polizas/${policy.policyId}`)}
            emptyMessage="Esta factura no tiene pólizas asociadas."
          />
        </DetailSection>
      )}

      {/* Modals */}
      <EditInvoiceModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        invoiceId={invoice.id}
      />
      {transitionTarget && (
        <StatusTransitionModal
          isOpen={transitionModalOpen}
          onClose={() => {
            setTransitionModalOpen(false)
            setTransitionTarget(null)
          }}
          invoice={invoice}
          targetStatus={transitionTarget}
        />
      )}
      <ValidateInvoiceModal
        isOpen={validateModalOpen}
        onClose={() => setValidateModalOpen(false)}
        invoice={invoice}
      />
    </DetailLayout>
  )
}
