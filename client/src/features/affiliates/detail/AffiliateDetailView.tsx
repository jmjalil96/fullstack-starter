/**
 * AffiliateDetailView - Main detail view with tab navigation
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import { DetailPageLayout } from '../../../shared/components/DetailPageLayout'
import { Button } from '../../../shared/components/ui/Button'
import { Spinner } from '../../../shared/components/ui/Spinner'
import { useGetAffiliateDetail } from '../../../shared/hooks/affiliates'
import { getAffiliateTabs } from '../../../shared/utils/detailTabs'
import { TypeBadge } from '../views/components/TypeBadge'

import { AffiliateOverviewTab, AffiliatePoliciesTab } from './tabs'

/**
 * Props for AffiliateDetailView component
 */
interface AffiliateDetailViewProps {
  /** Affiliate ID from route params */
  affiliateId: string
}

/**
 * AffiliateDetailView - Orchestrates affiliate detail page with tab navigation
 *
 * Features:
 * - Tab-based navigation (Resumen, Familia, Pólizas)
 * - Responsive sidebar (vertical pills on desktop, dropdown on mobile)
 * - Parallel data fetching (affiliate + counts)
 * - Nested routing for tabs
 *
 * @example
 * <AffiliateDetailView affiliateId="abc123" />
 */
export function AffiliateDetailView({ affiliateId }: AffiliateDetailViewProps) {
  const navigate = useNavigate()

  // Fetch affiliate data
  const { affiliate, loading, error, refetch } = useGetAffiliateDetail(affiliateId)

  // Count data for tab badges
  const [counts, setCounts] = useState<{ policies?: number }>({})
  const countsAbort = useRef<AbortController | null>(null)

  /**
   * Fetch count data in parallel when affiliate loads
   * Uses AbortController for cleanup
   */
  useEffect(() => {
    if (!affiliate) return

    // Abort previous request
    countsAbort.current?.abort()
    const controller = new AbortController()
    countsAbort.current = controller

    // Fetch counts
    const fetchCounts = async () => {
      try {
        // TODO: Replace with real endpoint when available
        // const policiesResponse = await getPolicies(
        //   { affiliateId: affiliate.id, limit: 1 },
        //   { signal: controller.signal }
        // )

        setCounts({
          policies: undefined, // Will show when endpoint available
        })
      } catch (err) {
        // Silent fail - counts remain undefined (badges won't show)
        if (err instanceof Error && err.name !== 'AbortError') {
          console.warn('Failed to fetch affiliate counts:', err)
        }
      }
    }

    fetchCounts()

    return () => controller.abort()
  }, [affiliate?.id, affiliate])

  /**
   * Compute tabs based on affiliate data and counts
   */
  const tabs = useMemo(() => {
    if (!affiliate) return []
    return getAffiliateTabs(affiliate, counts)
  }, [affiliate, counts])

  const basePath = `/clientes/afiliados/${affiliateId}`

  // Loading state - show simple spinner
  if (loading && !affiliate && !error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium mb-2">Error al cargar afiliado</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Reintentar
        </button>
      </div>
    )
  }

  // TypeScript guard - affiliate exists at this point
  if (!affiliate) return null

  return (
    <DetailPageLayout
      title={`${affiliate.firstName} ${affiliate.lastName}`}
      subtitle={`ID: ${affiliate.id}`}
      badge={<TypeBadge type={affiliate.affiliateType} />}
      tabs={tabs}
      basePath={basePath}
      actions={
        <Button
          variant="ghost"
          onClick={() => navigate('/clientes/afiliados')}
          className="flex items-center gap-1 hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver
        </Button>
      }
    >
      <Routes>
        {/* Overview Tab (default) */}
        <Route
          index
          element={<AffiliateOverviewTab affiliate={affiliate} onRefetch={refetch} />}
        />

        {/* Policies Tab */}
        <Route
          path="polizas"
          element={<AffiliatePoliciesTab affiliateId={affiliate.id} />}
        />

        {/* Fallback: redirect to overview */}
        <Route path="*" element={<Navigate to={basePath} replace />} />
      </Routes>
    </DetailPageLayout>
  )
}
