/**
 * PolicyAffiliatesTab - Lists affiliates covered under the policy with filters/pagination
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Spinner } from '../../../../shared/components/ui/Spinner'
import { useGetPolicyAffiliates } from '../../../../shared/hooks/policies/useGetPolicyAffiliates'
import {
  PolicyAffiliatesFilterBar,
  PolicyAffiliatesPagination,
  PolicyAffiliatesSkeleton,
  PolicyAffiliatesTable,
} from '../affiliates'

interface PolicyAffiliatesTabProps {
  policyId: string
}

export function PolicyAffiliatesTab({ policyId }: PolicyAffiliatesTabProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const [filters, setFilters] = useState<{
    affiliateType?: 'OWNER' | 'DEPENDENT'
    isActive?: boolean
    search?: string
  }>(() => ({
    affiliateType: (searchParams.get('affiliateType') as 'OWNER' | 'DEPENDENT') || undefined,
    isActive:
      searchParams.get('isActive') === 'true'
        ? true
        : searchParams.get('isActive') === 'false'
          ? false
          : undefined,
    search: searchParams.get('search') || undefined,
  }))

  const [page, setPage] = useState(() => {
    const pageParam = searchParams.get('page')
    const parsed = pageParam ? parseInt(pageParam, 10) : 1
    return parsed >= 1 ? parsed : 1
  })

  // Sync state → URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.affiliateType) params.set('affiliateType', filters.affiliateType)
    if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive))
    if (filters.search) params.set('search', filters.search)
    if (page > 1) params.set('page', String(page))
    setSearchParams(params, { replace: true })
  }, [filters, page, setSearchParams])

  const { affiliates, pagination, loading, error } = useGetPolicyAffiliates(policyId, {
    ...filters,
    page,
  })

  // Delayed spinner
  const [showLoading, setShowLoading] = useState(false)
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setShowLoading(false), 300)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setShowLoading(true), 200)
    return () => clearTimeout(t)
  }, [loading])

  const handleFiltersChange = (newFilters: {
    search: string
    affiliateType: 'OWNER' | 'DEPENDENT' | ''
    isActive: boolean | undefined
  }) => {
    const converted = {
      search: newFilters.search || undefined,
      affiliateType: (newFilters.affiliateType || undefined) as 'OWNER' | 'DEPENDENT' | undefined,
      isActive: newFilters.isActive,
    }
    const changed =
      converted.affiliateType !== filters.affiliateType ||
      converted.isActive !== filters.isActive ||
      converted.search !== filters.search
    setFilters(converted)
    if (changed) setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Initial load skeleton
  if (loading && affiliates.length === 0 && !error) {
    return <PolicyAffiliatesSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <PolicyAffiliatesFilterBar
        filters={{
          search: filters.search || '',
          affiliateType: (filters.affiliateType as 'OWNER' | 'DEPENDENT' | '') || '',
          isActive: filters.isActive,
        }}
        onFilterChange={handleFiltersChange}
        onReset={() => {
          setFilters({ search: '', affiliateType: undefined, isActive: undefined })
          setPage(1)
        }}
      />

      {/* Table */}
      <PolicyAffiliatesTable affiliates={affiliates} loading={loading} />

      {/* Corner spinner on refetch */}
      {showLoading && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-full shadow-lg p-3">
            <Spinner size="sm" />
          </div>
        </div>
      )}

      {/* Pagination */}
      {!error && pagination && (
        <PolicyAffiliatesPagination pagination={pagination} onPageChange={handlePageChange} loading={loading} />
      )}
    </div>
  )
}


