/**
 * PoliciesFilterBar - Filter controls for policies list
 */

import { type ChangeEvent, type KeyboardEvent, useEffect, useId, useState } from 'react'

import { Button } from '../../../../shared/components/ui/Button'
import type { PolicyStatus } from '../../../../shared/types/policies'

/**
 * Props for PoliciesFilterBar component
 */
interface PoliciesFilterBarProps {
  /** Current filter values */
  filters: {
    status?: PolicyStatus
    search?: string
  }
  /** Callback when filters change */
  onFiltersChange: (filters: {
    status?: PolicyStatus
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

  // Local search state for debouncing
  const [localSearch, setLocalSearch] = useState(filters.search || '')

  // Local status state for debouncing
  const [localStatus, setLocalStatus] = useState(filters.status)

  // Sync localSearch when parent filters.search changes
  useEffect(() => {
    setLocalSearch(filters.search || '')
  }, [filters.search])

  // Sync localStatus when parent filters.status changes
  useEffect(() => {
    setLocalStatus(filters.status)
  }, [filters.status])

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
   * Clear all filters
   */
  const handleClearFilters = () => {
    onFiltersChange({})
  }

  // Check if any filters are active
  const hasActiveFilters = Boolean(filters.status || filters.search)

  // Determine if inputs should be disabled
  const isDisabled = loading

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
