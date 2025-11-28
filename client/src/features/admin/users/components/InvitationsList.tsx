/**
 * Invitations List Component
 * Displays invitations with filters and actions
 */

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { DataTable, type Column } from '../../../../shared/components/ui/data-display/DataTable'
import { FilterBar, type FilterConfig } from '../../../../shared/components/ui/data-display/FilterBar'
import { StatusBadge } from '../../../../shared/components/ui/data-display/StatusBadge'
import { Button } from '../../../../shared/components/ui/forms/Button'
import { useToast } from '../../../../shared/hooks/useToast'
import { useResendInvitation, useRevokeInvitation } from '../hooks/useInvitationMutations'
import { useInvitations } from '../hooks/useInvitations'
import type { InvitationListItemResponse, InvitationStatus, InvitationType } from '../invitations'

// --- Constants ---
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

// --- Type Guards ---
function isValidStatus(value: string): value is InvitationStatus {
  return ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'].includes(value)
}

function isValidType(value: string): value is InvitationType {
  return ['EMPLOYEE', 'AGENT', 'AFFILIATE'].includes(value)
}

// --- Configuration ---
const FILTER_CONFIG: FilterConfig[] = [
  { key: 'search', type: 'text', placeholder: 'Buscar por email...' },
  {
    key: 'status',
    type: 'searchable-select',
    placeholder: 'Estado',
    options: [
      { value: 'PENDING', label: 'Pendiente' },
      { value: 'ACCEPTED', label: 'Aceptada' },
      { value: 'EXPIRED', label: 'Expirada' },
      { value: 'REVOKED', label: 'Revocada' },
    ],
  },
  {
    key: 'type',
    type: 'searchable-select',
    placeholder: 'Tipo',
    options: [
      { value: 'EMPLOYEE', label: 'Empleado' },
      { value: 'AGENT', label: 'Agente' },
      { value: 'AFFILIATE', label: 'Afiliado' },
    ],
  },
]

const STATUS_COLORS: Record<InvitationStatus, 'yellow' | 'green' | 'gray' | 'red'> = {
  PENDING: 'yellow',
  ACCEPTED: 'green',
  EXPIRED: 'gray',
  REVOKED: 'red',
}

const STATUS_LABELS: Record<InvitationStatus, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptada',
  EXPIRED: 'Expirada',
  REVOKED: 'Revocada',
}

const TYPE_LABELS: Record<InvitationType, string> = {
  EMPLOYEE: 'Empleado',
  AGENT: 'Agente',
  AFFILIATE: 'Afiliado',
}

interface InvitationsListProps {
  onInviteClick: () => void
}

export function InvitationsList({ onInviteClick }: InvitationsListProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()
  const resendMutation = useResendInvitation()
  const revokeMutation = useRevokeInvitation()
  const [actioningId, setActioningId] = useState<string | null>(null)

  // Derive filters from URL
  const filters: Record<string, string> = {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    type: searchParams.get('type') || '',
    page: searchParams.get('page') || String(DEFAULT_PAGE),
    limit: searchParams.get('limit') || String(DEFAULT_LIMIT),
  }

  // Update URL with new filters
  const applyFiltersToUrl = (next: Record<string, string>) => {
    const params = new URLSearchParams()

    if (next.search) params.set('search', next.search)
    if (next.status) params.set('status', next.status)
    if (next.type) params.set('type', next.type)
    if (next.page && next.page !== String(DEFAULT_PAGE)) params.set('page', next.page)
    if (next.limit && next.limit !== String(DEFAULT_LIMIT)) params.set('limit', next.limit)

    setSearchParams(params, { replace: true })
  }

  // Validate filters
  const validatedStatus = filters.status && isValidStatus(filters.status) ? filters.status : undefined
  const validatedType = filters.type && isValidType(filters.type) ? filters.type : undefined
  const validatedSearch = filters.search?.trim() || undefined

  // Data fetching
  const { data, isLoading } = useInvitations({
    search: validatedSearch,
    status: validatedStatus,
    type: validatedType,
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
      status: '',
      type: '',
      page: String(DEFAULT_PAGE),
      limit: String(DEFAULT_LIMIT),
    })
  }

  const handleResend = async (invitation: InvitationListItemResponse) => {
    setActioningId(invitation.id)
    try {
      await resendMutation.mutateAsync(invitation.id)
      toast.success('Invitación reenviada exitosamente')
    } catch {
      toast.error('Error al reenviar la invitación')
    } finally {
      setActioningId(null)
    }
  }

  const handleRevoke = async (invitation: InvitationListItemResponse) => {
    setActioningId(invitation.id)
    try {
      await revokeMutation.mutateAsync(invitation.id)
      toast.success('Invitación revocada exitosamente')
    } catch {
      toast.error('Error al revocar la invitación')
    } finally {
      setActioningId(null)
    }
  }

  // Column definitions
  const columns: Column<InvitationListItemResponse>[] = [
    {
      key: 'email',
      header: 'Email',
      render: (inv) => (
        <div>
          <div className="font-medium text-gray-900">{inv.email}</div>
          {inv.name && <div className="text-sm text-gray-500">{inv.name}</div>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (inv) => TYPE_LABELS[inv.type],
    },
    {
      key: 'roleName',
      header: 'Rol',
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      render: (inv) => (
        <StatusBadge
          label={STATUS_LABELS[inv.status]}
          color={STATUS_COLORS[inv.status]}
        />
      ),
    },
    {
      key: 'expiresAt',
      header: 'Expira',
      render: (inv) => new Date(inv.expiresAt).toLocaleDateString('es-ES'),
    },
    {
      key: 'createdByName',
      header: 'Creado por',
      render: (inv) => inv.createdByName || '—',
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'center',
      render: (inv) => {
        if (inv.status !== 'PENDING') return null
        const isActioning = actioningId === inv.id

        return (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleResend(inv)
              }}
              disabled={isActioning}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
            >
              Reenviar
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRevoke(inv)
              }}
              disabled={isActioning}
              className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
            >
              Revocar
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex justify-end">
        <Button onClick={onInviteClick}>
          Invitar Usuario
        </Button>
      </div>

      {/* Filters */}
      <FilterBar
        config={FILTER_CONFIG}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClear}
      />

      {/* Data Table */}
      <DataTable
        data={data?.invitations || []}
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
        emptyMessage="No se encontraron invitaciones con estos filtros."
      />
    </div>
  )
}
