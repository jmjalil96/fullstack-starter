import { useState } from 'react'

import { DataTable, type Column } from '../shared/components/ui/data-display/DataTable'
import {
  DataField,
  DataGrid,
  DetailSection,
} from '../shared/components/ui/data-display/DetailSection'
import { FilterBar, type FilterConfig } from '../shared/components/ui/data-display/FilterBar'
import { Button } from '../shared/components/ui/forms/Button'
import { ButtonDropdown } from '../shared/components/ui/interactive/ButtonDropdown'
import { DetailSidebar } from '../shared/components/ui/layout/DetailSidebar'
import { PageHeader } from '../shared/components/ui/layout/PageHeader'
import { WorkflowStepper } from '../shared/components/ui/layout/WorkflowStepper'

// Mock Data Type
interface Client {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive'
  lastLogin: string
}

// Mock Data
const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'TechCorp S.A.', email: 'admin@techcorp.com', status: 'active', lastLogin: '2h ago' },
  {
    id: '2',
    name: 'Logística Express',
    email: 'info@logex.com',
    status: 'active',
    lastLogin: '1d ago',
  },
  {
    id: '3',
    name: 'Consultores ABC',
    email: 'contacto@abc.com',
    status: 'inactive',
    lastLogin: '5d ago',
  },
  {
    id: '4',
    name: 'Innovación Global',
    email: 'rrhh@innovacion.com',
    status: 'active',
    lastLogin: '3h ago',
  },
]

export function ComponentTest() {
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [_createModalOpen, setCreateModalOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState('general')
  const [workflowStatus, setWorkflowStatus] = useState<'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'>('PENDING')

  // Define Filter Config
  const filterConfig: FilterConfig[] = [
    { key: 'search', type: 'text', placeholder: 'Buscar clientes...' },
    {
      key: 'status',
      type: 'select',
      placeholder: 'Estado',
      options: [
        { value: 'active', label: 'Activo' },
        { value: 'inactive', label: 'Inactivo' },
      ],
    },
    {
      key: 'client',
      type: 'searchable-select',
      placeholder: 'Cliente',
      options: [
        { value: '1', label: 'TechCorp S.A.' },
        { value: '2', label: 'Logística Express' },
        { value: '3', label: 'Consultores ABC' },
        { value: '4', label: 'Innovación Global' },
      ],
    },
  ]

  // Define Columns
  const columns: Column<Client>[] = [
    { key: 'name', header: 'Cliente' },
    { key: 'email', header: 'Correo' },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      render: (item) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {item.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    { key: 'lastLogin', header: 'Último Acceso', align: 'right' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-navy)] mb-2">Component Test</h1>
        <p className="text-gray-500">Testing ground for UI components.</p>
      </div>

      {/* Page Header Showcase */}
      <section className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono text-gray-400 mb-4">
          PageHeader Component
        </div>

        <PageHeader
          title="Clientes"
          breadcrumbs={[
            { label: 'Inicio', to: '/dashboard' },
            { label: 'Clientes', to: '/clientes' },
            { label: 'Lista' },
          ]}
          secondaryAction={
            <Button variant="outline" className="!py-2">
              Exportar
            </Button>
          }
          action={
            <ButtonDropdown
              label="Nuevo Cliente"
              mainAction={() => setCreateModalOpen(true)}
              items={[
                { label: 'Importar CSV', onClick: () => alert('Importing CSV...') },
                { label: 'Descargar Plantilla', onClick: () => alert('Downloading template...') },
              ]}
            />
          }
        />
      </section>

      {/* FilterBar Showcase */}
      <section className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono text-gray-400 mb-4">
          FilterBar Component
        </div>

        <FilterBar
          config={filterConfig}
          values={filters}
          onChange={setFilters}
          onClear={() => setFilters({})}
        />

        {/* Show current filter values */}
        {Object.keys(filters).length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-mono text-blue-700">
              <strong>Current Filters:</strong> {JSON.stringify(filters, null, 2)}
            </p>
          </div>
        )}
      </section>

      {/* DataTable Showcase */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--color-navy)]">Data Table</h2>
          <Button onClick={() => setLoading(!loading)} variant="outline" className="text-xs !py-2">
            Toggle Loading
          </Button>
        </div>

        <DataTable
          data={MOCK_CLIENTS}
          columns={columns}
          isLoading={loading}
          onRowClick={(item) => alert(`Clicked: ${item.name}`)}
          pagination={{
            page: page,
            totalPages: 5,
            total: 50,
            limit: 10,
            hasMore: page < 5,
            onPageChange: setPage,
          }}
        />
      </section>

      {/* Detail Sidebar Showcase */}
      <section className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono text-gray-400 mb-4">
          DetailSidebar Component
        </div>

        <div className="flex gap-8 bg-gray-100 p-8 rounded-2xl border border-dashed border-gray-300">
          {/* Sidebar */}
          <DetailSidebar
            activeId={activeTab}
            onSelect={setActiveTab}
            items={[
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
                badge: 3,
              },
              {
                id: 'claims',
                label: 'Reclamos',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                ),
                badge: 'New',
              },
              {
                id: 'history',
                label: 'Historial',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
              },
            ]}
          />

          {/* Fake Content Area */}
          <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 p-8 shadow-sm min-h-[300px]">
            <h3 className="text-lg font-bold text-gray-800 capitalize mb-2">{activeTab} Content</h3>
            <p className="text-gray-500 mt-2">
              This content changes based on the sidebar selection.
            </p>
          </div>
        </div>
      </section>

      {/* Detail Section Showcase */}
      <section className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono text-gray-400 mb-4">
          DetailSection Component
        </div>

        <DetailSection
          title="Información General"
          action={
            <Button variant="outline" className="!py-1.5 !px-3 text-xs">
              Editar
            </Button>
          }
        >
          <DataGrid columns={3}>
            <DataField label="Razón Social" value="TechCorp S.A." />
            <DataField label="RUC" value="20123456789" />
            <DataField label="Industria" value="Tecnología" />

            <DataField label="Email Corporativo" value="contacto@techcorp.com" />
            <DataField label="Teléfono" value="+51 1 555 0101" />
            <DataField
              label="Estado"
              value={
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Activo
                </span>
              }
            />

            <DataField
              label="Dirección Fiscal"
              value="Av. Javier Prado Este 456, Oficina 1201, San Isidro, Lima"
              fullWidth
            />
          </DataGrid>
        </DetailSection>
      </section>

      {/* Workflow Stepper Showcase */}
      <section className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono text-gray-400 mb-4">
          WorkflowStepper Component
        </div>

        <WorkflowStepper currentStatus={workflowStatus} onActionClick={setWorkflowStatus} />

        {/* Control buttons for demo */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setWorkflowStatus('PENDING')} className="text-xs">
            Reset to PENDING
          </Button>
        </div>
      </section>
    </div>
  )
}
