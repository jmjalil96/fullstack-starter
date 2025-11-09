/**
 * ClientsFilterBar - Filter controls for clients list
 */

import { type ChangeEvent, type KeyboardEvent, useEffect, useId, useState } from 'react'

import { Button } from '../../../../shared/components/ui/Button'

/**
 * Props for ClientsFilterBar component
 */
interface ClientsFilterBarProps {
  /** Current filter values */
  filters: {
    isActive?: boolean
    search?: string
  }
  /** Callback when filters change */
  onFiltersChange: (filters: { isActive?: boolean; search?: string }) => void
  /** Loading state (disables inputs) */
  loading?: boolean
}

/**
 * ClientsFilterBar - Search and isActive filter controls
 *
 * Features:
 * - Search by name, taxId, or email (debounced 400ms, immediate on Enter)
 * - Filter by active status dropdown
 * - Clear filters button (when filters active)
 * - Client-side validation (min 2 chars, max 100)
 * - Disabled during loading
 * - Full accessibility
 *
 * Note: Parent should reset page to 1 when filters change to avoid empty results.
 *
 * @example
 * const [filters, setFilters] = useState({ isActive: undefined, search: undefined })
 * const [page, setPage] = useState(1)
 *
 * const handleFiltersChange = (newFilters) => {
 *   setFilters(newFilters)
 *   setPage(1)  // Reset to first page
 * }
 *
 * <ClientsFilterBar
 *   filters={filters}
 *   onFiltersChange={handleFiltersChange}
 *   loading={loading}
 * />
 */
export function ClientsFilterBar({ filters, onFiltersChange, loading = false }: ClientsFilterBarProps) {
  const searchId = useId()
  const isActiveId = useId()

  // Local search state for debouncing
  const [localSearch, setLocalSearch] = useState(filters.search || '')

  // Local isActive state for debouncing
  const [localIsActive, setLocalIsActive] = useState<boolean | undefined>(filters.isActive)

  // Sync localSearch when parent filters.search changes
  useEffect(() => {
    setLocalSearch(filters.search || '')
  }, [filters.search])

  // Sync localIsActive when parent filters.isActive changes
  useEffect(() => {
    setLocalIsActive(filters.isActive)
  }, [filters.isActive])

  // Debounce search updates (400ms delay for smoother UX)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateSearchFilter(localSearch)
    }, 400)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch])

  // Debounce isActive updates (150ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localIsActive !== filters.isActive) {
        onFiltersChange({ ...filters, isActive: localIsActive })
      }
    }, 150)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localIsActive])

  /**
   * Update search filter with validation
   */
  const updateSearchFilter = (value: string) => {
    const trimmed = value.trim()
    // Enforce min 2 chars, max 100 chars (backend validation)
    const normalized = trimmed.length >= 2 && trimmed.length <= 100 ? trimmed : undefined

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
   * Handle isActive dropdown change (debounced via localIsActive)
   */
  const handleIsActiveChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const isActiveValue = value === '' ? undefined : value === 'true'
    setLocalIsActive(isActiveValue)
  }

  /**
   * Clear all filters (reset local state immediately for instant UI update)
   */
  const handleClearFilters = () => {
    setLocalSearch('')
    setLocalIsActive(undefined)
    onFiltersChange({})
  }

  // Check if any filters are active
  const hasActiveFilters = Boolean(filters.isActive !== undefined || filters.search)

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
              placeholder="Buscar por nombre, RUC o correo..."
              disabled={loading}
              aria-disabled={loading}
              maxLength={100}
              className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* isActive Dropdown */}
        <div className="w-48">
          <label htmlFor={isActiveId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
            Estado
          </label>
          <select
            id={isActiveId}
            value={localIsActive === undefined ? '' : localIsActive.toString()}
            onChange={handleIsActiveChange}
            disabled={loading}
            aria-disabled={loading}
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
          >
            <option value="">Todos</option>
            <option value="true">Solo Activos</option>
            <option value="false">Solo Inactivos</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClearFilters}
              disabled={loading}
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
