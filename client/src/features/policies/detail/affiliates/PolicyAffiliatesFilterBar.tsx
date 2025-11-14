/**
 * PolicyAffiliatesFilterBar - Filter controls for affiliates under a policy
 */

import { type ChangeEvent, type KeyboardEvent, useEffect, useId, useState } from 'react'

import { Button } from '../../../../shared/components/ui/Button'

interface PolicyAffiliatesFilterBarProps {
  filters: {
    search: string
    affiliateType: 'OWNER' | 'DEPENDENT' | ''
    isActive: boolean | undefined
  }
  onFilterChange: (filters: {
    search: string
    affiliateType: 'OWNER' | 'DEPENDENT' | ''
    isActive: boolean | undefined
  }) => void
  onReset: () => void
}

export function PolicyAffiliatesFilterBar({
  filters,
  onFilterChange,
  onReset,
}: PolicyAffiliatesFilterBarProps) {
  const searchId = useId()
  const typeId = useId()
  const statusId = useId()

  // Local state for debouncing
  const [localSearch, setLocalSearch] = useState(filters.search)
  const [localType, setLocalType] = useState(filters.affiliateType)
  const [localStatus, setLocalStatus] = useState(filters.isActive)

  // Sync from parent
  useEffect(() => setLocalSearch(filters.search), [filters.search])
  useEffect(() => setLocalType(filters.affiliateType), [filters.affiliateType])
  useEffect(() => setLocalStatus(filters.isActive), [filters.isActive])

  // Debounce search (400ms)
  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFilterChange({ ...filters, search: localSearch })
      }
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch])

  // Debounce type (150ms)
  useEffect(() => {
    const t = setTimeout(() => {
      if (localType !== filters.affiliateType) {
        onFilterChange({ ...filters, affiliateType: localType })
      }
    }, 150)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localType])

  // Debounce status (150ms)
  useEffect(() => {
    const t = setTimeout(() => {
      if (localStatus !== filters.isActive) {
        onFilterChange({ ...filters, isActive: localStatus })
      }
    }, 150)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStatus])

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (localSearch !== filters.search) {
        onFilterChange({ ...filters, search: localSearch })
      }
    }
  }

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setLocalType(e.target.value as 'OWNER' | 'DEPENDENT' | '')
  }

  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    let statusValue: boolean | undefined
    if (value === 'true') statusValue = true
    else if (value === 'false') statusValue = false
    else statusValue = undefined
    setLocalStatus(statusValue)
  }

  const hasActive = Boolean(filters.search || filters.affiliateType || filters.isActive !== undefined)

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg p-4 shadow-sm">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[250px]">
          <label htmlFor={searchId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
            Buscar
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-light)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id={searchId}
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar por nombre o documento..."
              className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Type */}
        <div className="w-48">
          <label htmlFor={typeId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
            Tipo
          </label>
          <select
            id={typeId}
            value={localType}
            onChange={handleTypeChange}
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors"
          >
            <option value="">Todos</option>
            <option value="OWNER">Titular</option>
            <option value="DEPENDENT">Dependiente</option>
          </select>
        </div>

        {/* Status */}
        <div className="w-48">
          <label htmlFor={statusId} className="block text-sm font-medium text-[var(--color-navy)] mb-2">
            Estado
          </label>
          <select
            id={statusId}
            value={localStatus === undefined ? '' : String(localStatus)}
            onChange={handleStatusChange}
            className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-teal)] focus:border-transparent transition-colors"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        {/* Clear */}
        {hasActive && (
          <div>
            <Button type="button" variant="ghost" onClick={onReset} aria-label="Limpiar filtros">
              Limpiar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}


