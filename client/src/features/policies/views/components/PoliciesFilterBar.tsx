/**
 * PoliciesFilterBar - Filter controls for policies list
 */

import { type ChangeEvent, type KeyboardEvent, useEffect, useId, useState } from 'react'

import { Button } from '../../../../shared/components/ui/Button'
import { useAvailableClients } from '../../../../shared/hooks/policies/useAvailableClients'
import { useAvailableInsurers } from '../../../../shared/hooks/policies/useAvailableInsurers'
import type { PolicyStatus } from '../../../../shared/types/policies'

/**
 * Props for PoliciesFilterBar component
 */
interface PoliciesFilterBarProps {
  /** Current filter values */
  filters: {
    status?: PolicyStatus
    clientId?: string
    insurerId?: string
    search?: string
  }
  /** Callback when filters change */
  onFiltersChange: (filters: {
    status?: PolicyStatus
    clientId?: string
    insurerId?: string
    search?: string
  }) => void
  /** Loading state (disables inputs) */
  loading?: boolean
}

/**
 * PoliciesFilterBar - Search and filter controls for policies
 *
 * Features:
 * - Search by policy number (debounced 400ms, immediate on Enter)
 * - Filter by status dropdown (PENDING/ACTIVE/EXPIRED/CANCELLED)
 * - Filter by client dropdown (searchable select)
 * - Filter by insurer dropdown (searchable select)
 * - Clear filters button (when filters active)
 * - Client-side validation (min 3 chars, max 50, uppercase)
 * - Disabled during loading
 * - Full accessibility
 *
 * Note: Parent should reset page to 1 when filters change to avoid empty results.
 *
 * @example
 * const [filters, setFilters] = useState({})
 * const [page, setPage] = useState(1)
 *
 * const handleFiltersChange = (newFilters) => {
 *   setFilters(newFilters)
 *   setPage(1)  // Reset to first page
 * }
 *
 * <PoliciesFilterBar
 *   filters={filters}
 *   onFiltersChange={handleFiltersChange}
 *   loading={loading}
 * />
 */
export function PoliciesFilterBar({ filters, onFiltersChange, loading = false }: PoliciesFilterBarProps) {
  const searchId = useId()
  const statusId = useId()
  const clientId = useId()
  const insurerId = useId()

  // Fetch available clients and insurers for dropdowns
  const { clients, loading: clientsLoading } = useAvailableClients()
  const { insurers, loading: insurersLoading } = useAvailableInsurers()

  // Local search state for debouncing
  const [localSearch, setLocalSearch] = useState(filters.search || '')

  // Local status state for debouncing
  const [localStatus, setLocalStatus] = useState(filters.status)

  // Local client state for debouncing
  const [localClientId, setLocalClientId] = useState(filters.clientId)

  // Local insurer state for debouncing
  const [localInsurerId, setLocalInsurerId] = useState(filters.insurerId)

  // Sync localSearch when parent filters.search changes
  useEffect(() => {
    setLocalSearch(filters.search || '')
  }, [filters.search])

  // Sync localStatus when parent filters.status changes
  useEffect(() => {
    setLocalStatus(filters.status)
  }, [filters.status])

  // Sync localClientId when parent filters.clientId changes
  useEffect(() => {
    setLocalClientId(filters.clientId)
  }, [filters.clientId])

  // Sync localInsurerId when parent filters.insurerId changes
  useEffect(() => {
    setLocalInsurerId(filters.insurerId)
  }, [filters.insurerId])

  // Debounce search updates (400ms delay for smoother UX)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateSearchFilter(localSearch)
    }, 400)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch])

  // Debounce status updates (150ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localStatus !== filters.status) {
        onFiltersChange({ ...filters, status: localStatus })
      }
    }, 150)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStatus])

  // Debounce client updates (150ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localClientId !== filters.clientId) {
        onFiltersChange({ ...filters, clientId: localClientId })
      }
    }, 150)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localClientId])

  // Debounce insurer updates (150ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localInsurerId !== filters.insurerId) {
        onFiltersChange({ ...filters, insurerId: localInsurerId })
      }
    }, 150)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localInsurerId])

  /**
   * Update search filter with validation and normalization
   */
  const updateSearchFilter = (value: string) => {
    const trimmed = value.trim().toUpperCase()
    // Enforce min 3 chars, max 50 chars (backend validation)
    const normalized = trimmed.length >= 3 && trimmed.length <= 50 ? trimmed : undefined

    // Only update if changed (prevent unnecessary fetches)
    if (normalized !== filters.search) {
      onFiltersChange({ ...filters, search: normalized })
    }
  }

  /**
   * Handle Enter key in search input (bypass debounce)
   */
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      updateSearchFilter(localSearch)
    }
  }

  /**
   * Handle status dropdown change (debounced via localStatus)
   */
  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as PolicyStatus | ''
    const statusValue = newStatus || undefined
    setLocalStatus(statusValue)
  }

  /**
   * Handle client dropdown change (debounced via localClientId)
   */
  const handleClientChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newClientId = e.target.value || undefined
    setLocalClientId(newClientId)
  }

  /**
   * Handle insurer dropdown change (debounced via localInsurerId)
   */
  const handleInsurerChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newInsurerId = e.target.value || undefined
    setLocalInsurerId(newInsurerId)
  }

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    onFiltersChange({})
  }

  // Check if any filters are active
  const hasActiveFilters = Boolean(filters.status || filters.clientId || filters.insurerId || filters.search)

  // Determine if inputs should be disabled
  const isDisabled = loading || clientsLoading || insurersLoading

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg p-4 shadow-sm">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Search Input */}
        <div className="flex-1 min-w-[250px]">
          <label htmlFor={searchId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
            Buscar
          </label>
          <div className="relative">
            {/* Search Icon */}
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-light)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            {/* Search Input */}
            <input
              id={searchId}
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar por número de póliza..."
              disabled={isDisabled}
              aria-disabled={isDisabled}
              maxLength={50}
              className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="w-48">
          <label htmlFor={statusId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
            Estado
          </label>
          <select
            id={statusId}
            value={localStatus ?? ''}
            onChange={handleStatusChange}
            disabled={isDisabled}
            aria-disabled={isDisabled}
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="ACTIVE">Activo</option>
            <option value="EXPIRED">Vencido</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>

        {/* Client Dropdown */}
        <div className="w-56">
          <label htmlFor={clientId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
            Cliente
          </label>
          <select
            id={clientId}
            value={localClientId ?? ''}
            onChange={handleClientChange}
            disabled={isDisabled}
            aria-disabled={isDisabled}
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
          >
            <option value="">Todos los clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {/* Insurer Dropdown */}
        <div className="w-56">
          <label htmlFor={insurerId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
            Aseguradora
          </label>
          <select
            id={insurerId}
            value={localInsurerId ?? ''}
            onChange={handleInsurerChange}
            disabled={isDisabled}
            aria-disabled={isDisabled}
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
          >
            <option value="">Todas las aseguradoras</option>
            {insurers.map((insurer) => (
              <option key={insurer.id} value={insurer.id}>
                {insurer.name}
                {insurer.code ? ` (${insurer.code})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClearFilters}
              disabled={isDisabled}
              aria-label="Limpiar filtros"
            >
              Limpiar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
