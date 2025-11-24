import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { DataTable, type Column } from '../../shared/components/ui/data-display/DataTable'
import { FilterBar, type FilterConfig } from '../../shared/components/ui/data-display/FilterBar'
import { StatusBadge } from '../../shared/components/ui/data-display/StatusBadge'
import { Button } from '../../shared/components/ui/forms/Button'
import { PageHeader } from '../../shared/components/ui/layout/PageHeader'
import { INVOICE_LIFECYCLE } from '../../shared/constants/invoiceLifecycle'
import { useInvoices } from '../../shared/hooks/invoices/useInvoices'
import type { InvoiceListItemResponse, InvoiceStatus, PaymentStatus } from '../../shared/types/invoices'

import { CreateInvoiceModal } from './CreateInvoiceModal'

// --- Constants ---
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

/**
 * Type guard to validate InvoiceStatus at runtime
 * Protects against invalid URL parameters
 */
function isValidInvoiceStatus(value: string): value is InvoiceStatus {
  const validStatuses: InvoiceStatus[] = ['PENDING', 'VALIDATED', 'DISCREPANCY', 'CANCELLED']
  return validStatuses.includes(value as InvoiceStatus)
}

/**
 * Type guard to validate PaymentStatus at runtime
 * Protects against invalid URL parameters
 */
function isValidPaymentStatus(value: string): value is PaymentStatus {
  const validStatuses: PaymentStatus[] = ['PENDING_PAYMENT', 'PAID']
  return validStatuses.includes(value as PaymentStatus)
}

// --- Configuration ---
const FILTER_CONFIG: FilterConfig[] = [
  { key: 'search', type: 'text', placeholder: 'Buscar por número de factura...' },
  {
    key: 'status',
    type: 'searchable-select',
    placeholder: 'Estado',
    // Derive options from lifecycle config (single source of truth)
    options: Object.entries(INVOICE_LIFECYCLE).map(([value, config]) => ({
      value,
      label: config.label,
    })),
  },
  {
    key: 'paymentStatus',
    type: 'select',
    placeholder: 'Estado de Pago',
    options: [
      { value: 'PENDING_PAYMENT', label: 'Pendiente de Pago' },
      { value: 'PAID', label: 'Pagada' },
    ],
  },
]

const COLUMNS: Column<InvoiceListItemResponse>[] = [
  { key: 'invoiceNumber', header: 'Nº Factura' },
  { key: 'clientName', header: 'Cliente' },
  { key: 'insurerName', header: 'Aseguradora' },
  {
    key: 'billingPeriod',
    header: 'Período',
    align: 'center',
  },
  {
    key: 'totalAmount',
    header: 'Monto',
    align: 'right',
    render: (invoice) =>
      new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(invoice.totalAmount),
  },
  {
    key: 'status',
    header: 'Estado',
    align: 'center',
    render: (invoice) => {
      const statusConfig = INVOICE_LIFECYCLE[invoice.status]
      return <StatusBadge label={statusConfig.label} color={statusConfig.color} />
    },
  },
  {
    key: 'paymentStatus',
    header: 'Pago',
    align: 'center',
    render: (invoice) => {
      const paymentConfig = {
        PENDING_PAYMENT: { label: 'Pendiente', color: 'yellow' as const },
        PAID: { label: 'Pagada', color: 'green' as const },
      }
      const config = paymentConfig[invoice.paymentStatus]
      return <StatusBadge label={config.label} color={config.color} />
    },
  },
  {
    key: 'issueDate',
    header: 'Fecha Emisión',
    align: 'right',
    render: (invoice) =>
      new Date(invoice.issueDate).toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
  },
  {
    key: 'dueDate',
    header: 'Vencimiento',
    align: 'right',
    render: (invoice) =>
      invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString('es-EC', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '—',
  },
]

export function InvoicesList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isCreateOpen, setCreateOpen] = useState(false)

  // Derive filters from URL on every render (URL is source of truth)
  const filters: Record<string, string> = {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    paymentStatus: searchParams.get('paymentStatus') || '',
    page: searchParams.get('page') || String(DEFAULT_PAGE),
    limit: searchParams.get('limit') || String(DEFAULT_LIMIT),
  }

  // Helper: Update URL with new filters
  const applyFiltersToUrl = (next: Record<string, string>) => {
    const params = new URLSearchParams()

    if (next.search) params.set('search', next.search)
    if (next.status) params.set('status', next.status)
    if (next.paymentStatus) params.set('paymentStatus', next.paymentStatus)
    if (next.page && next.page !== String(DEFAULT_PAGE)) params.set('page', next.page)
    if (next.limit && next.limit !== String(DEFAULT_LIMIT)) params.set('limit', next.limit)

    setSearchParams(params, { replace: true })
  }

  // Validate and prepare status for API
  const validatedStatus = filters.status && isValidInvoiceStatus(filters.status)
    ? filters.status
    : undefined

  const validatedPaymentStatus = filters.paymentStatus && isValidPaymentStatus(filters.paymentStatus)
    ? filters.paymentStatus
    : undefined

  // Data Fetching
  const { data, isLoading } = useInvoices({
    search: filters.search || undefined,
    status: validatedStatus,
    paymentStatus: validatedPaymentStatus,
    page: Math.max(DEFAULT_PAGE, Number(filters.page) || DEFAULT_PAGE),
    limit: Number(filters.limit) || DEFAULT_LIMIT,
  })

  // Handlers
  const handleFilterChange = (newFilters: Record<string, string>) => {
    applyFiltersToUrl({ ...filters, ...newFilters, page: String(DEFAULT_PAGE) })
  }

  const handlePageChange = (newPage: number) => {
    applyFiltersToUrl({ ...filters, page: String(newPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLimitChange = (newLimit: number) => {
    applyFiltersToUrl({ ...filters, limit: String(newLimit), page: String(DEFAULT_PAGE) })
  }

  const handleClear = () => {
    applyFiltersToUrl({
      search: '',
      status: '',
      paymentStatus: '',
      page: String(DEFAULT_PAGE),
      limit: String(DEFAULT_LIMIT),
    })
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6">
      {/* Header */}
      <PageHeader
        title="Facturas"
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Facturas' },
        ]}
        secondaryAction={<Button variant="outline">Exportar</Button>}
        action={<Button onClick={() => setCreateOpen(true)}>Nueva Factura</Button>}
      />

      {/* Filters */}
      <FilterBar
        config={FILTER_CONFIG}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClear}
      />

      {/* Data Table */}
      <DataTable
        data={data?.invoices || []}
        columns={COLUMNS}
        isLoading={isLoading}
        pagination={
          data?.pagination
            ? {
                ...data.pagination,
                onPageChange: handlePageChange,
                onLimitChange: handleLimitChange,
                currentLimit: Number(filters.limit),
              }
            : undefined
        }
        onRowClick={(invoice) => navigate(`/facturas/${invoice.id}`)}
        emptyMessage="No se encontraron facturas con estos filtros."
      />

      {/* Create Modal */}
      <CreateInvoiceModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
