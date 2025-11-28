/**
 * Users List Component
 * Displays users with filters, actions, and management modals
 */

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { ApiRequestError } from '../../../../config/api'
import { DataTable, type Column } from '../../../../shared/components/ui/data-display/DataTable'
import { FilterBar, type FilterConfig } from '../../../../shared/components/ui/data-display/FilterBar'
import { StatusBadge } from '../../../../shared/components/ui/data-display/StatusBadge'
import { ConfirmDialog } from '../../../../shared/components/ui/feedback/ConfirmDialog'
import { useToast } from '../../../../shared/hooks/useToast'
import { useDeactivateUser } from '../hooks/useUserMutations'
import { useUsers } from '../hooks/useUsers'
import type { UserListItemResponse, UserType } from '../users'

import { ClientAccessModal } from './ClientAccessModal'
import { EditUserModal } from './EditUserModal'

// --- Constants ---
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

// --- Type Guards ---
function isValidType(value: string): value is UserType {
  return ['EMPLOYEE', 'AGENT', 'AFFILIATE', 'SYSTEM'].includes(value)
}

function isValidActiveStatus(value: string): value is 'true' | 'false' {
  return value === 'true' || value === 'false'
}

// --- Configuration ---
const FILTER_CONFIG: FilterConfig[] = [
  { key: 'search', type: 'text', placeholder: 'Buscar por email o nombre...' },
  {
    key: 'type',
    type: 'searchable-select',
    placeholder: 'Tipo',
    options: [
      { value: 'EMPLOYEE', label: 'Empleado' },
      { value: 'AGENT', label: 'Agente' },
      { value: 'AFFILIATE', label: 'Afiliado' },
      { value: 'SYSTEM', label: 'Sistema' },
    ],
  },
  {
    key: 'isActive',
    type: 'searchable-select',
    placeholder: 'Estado',
    options: [
      { value: 'true', label: 'Activo' },
      { value: 'false', label: 'Inactivo' },
    ],
  },
]

const TYPE_LABELS: Record<UserType, string> = {
  EMPLOYEE: 'Empleado',
  AGENT: 'Agente',
  AFFILIATE: 'Afiliado',
  SYSTEM: 'Sistema',
}

export function UsersList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()
  const deactivateUserMutation = useDeactivateUser()

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserListItemResponse | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [clientAccessModalOpen, setClientAccessModalOpen] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)

  // Derive filters from URL
  const filters: Record<string, string> = {
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || '',
    isActive: searchParams.get('isActive') || '',
    page: searchParams.get('page') || String(DEFAULT_PAGE),
    limit: searchParams.get('limit') || String(DEFAULT_LIMIT),
  }

  // Update URL with new filters
  const applyFiltersToUrl = (next: Record<string, string>) => {
    const params = new URLSearchParams()

    if (next.search) params.set('search', next.search)
    if (next.type) params.set('type', next.type)
    if (next.isActive) params.set('isActive', next.isActive)
    if (next.page && next.page !== String(DEFAULT_PAGE)) params.set('page', next.page)
    if (next.limit && next.limit !== String(DEFAULT_LIMIT)) params.set('limit', next.limit)

    setSearchParams(params, { replace: true })
  }

  // Validate filters
  const validatedType = filters.type && isValidType(filters.type) ? filters.type : undefined
  const validatedIsActive =
    filters.isActive && isValidActiveStatus(filters.isActive)
      ? filters.isActive === 'true'
      : undefined
  const validatedSearch = filters.search?.trim() || undefined

  // Data fetching
  const { data, isLoading } = useUsers({
    search: validatedSearch,
    type: validatedType,
    isActive: validatedIsActive,
    page: Math.max(DEFAULT_PAGE, Number(filters.page) || DEFAULT_PAGE),
    limit: Math.max(1, Number(filters.limit) || DEFAULT_LIMIT),
  })

  // Handlers
  const handleFilterChange = (newFilters: Record<string, string>) => {
    applyFiltersToUrl({ ...filters, ...newFilters, page: String(DEFAULT_PAGE) })
  }

  const handlePageChange = (newPage: number) => {
    applyFiltersToUrl({ ...filters, page: String(newPage) })
  }

  const handleLimitChange = (newLimit: number) => {
    applyFiltersToUrl({ ...filters, limit: String(newLimit), page: String(DEFAULT_PAGE) })
  }

  const handleClear = () => {
    applyFiltersToUrl({
      search: '',
      type: '',
      isActive: '',
      page: String(DEFAULT_PAGE),
      limit: String(DEFAULT_LIMIT),
    })
  }

  // Action handlers
  const handleEditRole = (user: UserListItemResponse) => {
    setSelectedUser(user)
    setEditModalOpen(true)
  }

  const handleClientAccess = (user: UserListItemResponse) => {
    setSelectedUser(user)
    setClientAccessModalOpen(true)
  }

  const handleDeactivate = (user: UserListItemResponse) => {
    setSelectedUser(user)
    setDeactivateDialogOpen(true)
  }

  const confirmDeactivate = async () => {
    if (!selectedUser) return

    try {
      await deactivateUserMutation.mutateAsync(selectedUser.id)
      toast.success('Usuario desactivado exitosamente')
      setDeactivateDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : 'Error al desactivar usuario'
      toast.error(message)
    }
  }

  // Column definitions
  const columns: Column<UserListItemResponse>[] = [
    {
      key: 'email',
      header: 'Email',
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900">{user.email}</div>
          {user.name && <div className="text-sm text-gray-500">{user.name}</div>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (user) => TYPE_LABELS[user.type],
    },
    {
      key: 'globalRoleName',
      header: 'Rol Global',
      render: (user) => user.globalRoleName || '—',
    },
    {
      key: 'clientAccessCount',
      header: 'Clientes',
      align: 'center',
      render: (user) => (user.clientAccessCount > 0 ? user.clientAccessCount : '—'),
    },
    {
      key: 'isActive',
      header: 'Estado',
      align: 'center',
      render: (user) => (
        <StatusBadge
          label={user.isActive ? 'Activo' : 'Inactivo'}
          color={user.isActive ? 'green' : 'gray'}
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Creado',
      render: (user) => new Date(user.createdAt).toLocaleDateString('es-ES'),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (user) => (
        <div className="flex items-center justify-end gap-1">
          {/* Edit Role Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleEditRole(user)
            }}
            className="p-2 text-gray-400 hover:text-[var(--color-navy)] hover:bg-gray-100 rounded-lg transition-colors"
            title="Editar Rol"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>

          {/* Client Access Button (Affiliates only) */}
          {user.type === 'AFFILIATE' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleClientAccess(user)
              }}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Gestionar Acceso a Clientes"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </button>
          )}

          {/* Deactivate Button */}
          {user.isActive && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleDeactivate(user)
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Desactivar Usuario"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Filters */}
      <FilterBar
        config={FILTER_CONFIG}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClear}
      />

      {/* Data Table */}
      <DataTable
        data={data?.users || []}
        columns={columns}
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
        emptyMessage="No se encontraron usuarios con estos filtros."
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
      />

      {/* Client Access Modal */}
      <ClientAccessModal
        isOpen={clientAccessModalOpen}
        onClose={() => {
          setClientAccessModalOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
      />

      {/* Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deactivateDialogOpen}
        onClose={() => {
          setDeactivateDialogOpen(false)
          setSelectedUser(null)
        }}
        onConfirm={confirmDeactivate}
        isLoading={deactivateUserMutation.isPending}
        title="Desactivar Usuario"
        message={
          selectedUser
            ? `¿Está seguro que desea desactivar a "${selectedUser.name || selectedUser.email}"? Esta acción cerrará todas sus sesiones activas.`
            : ''
        }
        confirmLabel="Desactivar"
        variant="danger"
      />
    </div>
  )
}
