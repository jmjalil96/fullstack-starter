/**
 * AffiliatesFilterBar - Filter controls for affiliates list
 */

import { type ChangeEvent, type KeyboardEvent, useEffect, useId, useState } from 'react'

import { Button } from '../../../../shared/components/ui/Button'

/**
 * Props for AffiliatesFilterBar component
 */
interface AffiliatesFilterBarProps {
  /** Current filter values */
  filters: {
    search: string
    affiliateType: 'OWNER' | 'DEPENDENT' | ''
    isActive: boolean | undefined
  }
  /** Callback when filters change */
  onFilterChange: (filters: {
    search: string
    affiliateType: 'OWNER' | 'DEPENDENT' | ''
    isActive: boolean | undefined
  }) => void
  /** Callback to reset all filters */
  onReset: () => void
}

/**
 * AffiliatesFilterBar - Search and filter controls for affiliates
 *
 * Features:
 * - Search by name or document (debounced 400ms, immediate on Enter)
 * - Filter by affiliate type dropdown (OWNER/DEPENDENT)
 * - Filter by active status dropdown
 * - Clear filters button (when filters active)
 * - Full accessibility
 *
 * Note: Parent should reset page to 1 when filters change to avoid empty results.
 *
 * @example
 * const [filters, setFilters] = useState({ search: '', affiliateType: '', isActive: undefined })
 * const [page, setPage] = useState(1)
 *
 * const handleFilterChange = (newFilters) => {
 *   setFilters(newFilters)
 *   setPage(1)  // Reset to first page
 * }
 *
 * const handleReset = () => {
 *   setFilters({ search: '', affiliateType: '', isActive: undefined })
 *   setPage(1)
 * }
 *
 * <AffiliatesFilterBar
 *   filters={filters}
 *   onFilterChange={handleFilterChange}
 *   onReset={handleReset}
 * />
 */
export function AffiliatesFilterBar({ filters, onFilterChange, onReset }: AffiliatesFilterBarProps) {
  const searchId = useId()
  const typeId = useId()
  const statusId = useId()

  // Local search state for debouncing
  const [localSearch, setLocalSearch] = useState(filters.search)

  // Local type state for debouncing
  const [localType, setLocalType] = useState(filters.affiliateType)

  // Local status state for debouncing
  const [localStatus, setLocalStatus] = useState(filters.isActive)

  // Sync localSearch when parent filters.search changes
  useEffect(() => {
    setLocalSearch(filters.search)
  }, [filters.search])

  // Sync localType when parent filters.affiliateType changes
  useEffect(() => {
    setLocalType(filters.affiliateType)
  }, [filters.affiliateType])

  // Sync localStatus when parent filters.isActive changes
  useEffect(() => {
    setLocalStatus(filters.isActive)
  }, [filters.isActive])

  // Debounce search updates (400ms delay for smoother UX)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFilterChange({ ...filters, search: localSearch })
      }
    }, 400)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch])

  // Debounce type updates (150ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localType !== filters.affiliateType) {
        onFilterChange({ ...filters, affiliateType: localType })
      }
    }, 150)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localType])

  // Debounce status updates (150ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localStatus !== filters.isActive) {
        onFilterChange({ ...filters, isActive: localStatus })
      }
    }, 150)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStatus])

  /**
   * Handle Enter key in search input (bypass debounce)
   */
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (localSearch !== filters.search) {
        onFilterChange({ ...filters, search: localSearch })
      }
    }
  }

  /**
   * Handle type dropdown change (debounced via localType)
   */
  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'OWNER' | 'DEPENDENT' | ''
    setLocalType(newType)
  }

  /**
   * Handle status dropdown change (debounced via localStatus)
   */
  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    let statusValue: boolean | undefined

    if (value === 'true') {
      statusValue = true
    } else if (value === 'false') {
      statusValue = false
    } else {
      statusValue = undefined
    }

    setLocalStatus(statusValue)
  }

  // Check if any filters are active
  const hasActiveFilters = Boolean(filters.search || filters.affiliateType || filters.isActive !== undefined)

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
              placeholder="Buscar por nombre o documento..."
              className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Type Dropdown */}
        <div className="w-48">
          <label htmlFor={typeId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
            Tipo
          </label>
          <select
            id={typeId}
            value={localType}
            onChange={handleTypeChange}
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
          >
            <option value="">Todos</option>
            <option value="OWNER">Titular</option>
            <option value="DEPENDENT">Dependiente</option>
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="w-48">
          <label htmlFor={statusId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
            Estado
          </label>
          <select
            id={statusId}
            value={localStatus === undefined ? '' : String(localStatus)}
            onChange={handleStatusChange}
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors disabled:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div>
            <Button
              type="button"
              variant="ghost"
              onClick={onReset}
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
