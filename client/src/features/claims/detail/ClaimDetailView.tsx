/**
 * ClaimDetailView - Main view for claim detail page
 * Uses DetailPageLayout with tab navigation
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import { DetailPageLayout } from '../../../shared/components/DetailPageLayout'
import { Button } from '../../../shared/components/ui/Button'
import { useGetClaimDetail } from '../../../shared/hooks/claims/useGetClaimDetail'
import { getClaimTabs } from '../../../shared/utils/detailTabs'
import { StatusBadge } from '../views/components/StatusBadge'

import { ClaimDetailSkeleton } from './components'
import { ClaimOverviewTab } from './tabs'

/**
 * Props for ClaimDetailView component
 */
interface ClaimDetailViewProps {
  /** Claim ID from route params */
  claimId: string
}

/**
 * ClaimDetailView - Complete claim detail page orchestrator
 *
 * Features:
 * - DetailPageLayout with tab navigation
 * - Fetches and displays claim data
 * - Tab-based organization (Overview, Timeline, Documents)
 * - Loading/error states
 * - Auto-refetch after updates
 *
 * @example
 * function ReclamoDetallePage() {
 *   const { id } = useParams()
 *   return <ClaimDetailView claimId={id!} />
 * }
 */
export function ClaimDetailView({ claimId }: ClaimDetailViewProps) {
  const navigate = useNavigate()

  // Fetch claim data
  const { claim, error, refetch } = useGetClaimDetail(claimId)

  // Counts state for tab badges
  const [counts, setCounts] = useState<{
    timelineItems?: number
    documents?: number
  }>({})

  // Counts abort controller ref
  const countsAbort = useRef<AbortController | null>(null)

  // Fetch counts for tab badges
  useEffect(() => {
    if (!claim) return

    // Cleanup previous request
    countsAbort.current?.abort()
    countsAbort.current = new AbortController()

    // TODO: Implement counts fetching when endpoints are ready
    // For now, set to undefined to avoid unused variable warning
    setCounts({ timelineItems: undefined, documents: undefined })

    return () => {
      countsAbort.current?.abort()
    }
  }, [claim])

  // Generate tabs with counts (guard for null)
  const tabs = useMemo(() => {
    if (!claim) return [{ label: 'Resumen', path: '' }]
    return getClaimTabs(claim, {
      timelineItems: counts.timelineItems,
      documents: counts.documents,
    })
  }, [claim, counts])

  // Loading state - show skeleton if no data and no error
  if (!claim && !error) {
    return <ClaimDetailSkeleton />
  }

  // Error state (includes 404 not found)
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium mb-2">Error al cargar reclamo</p>
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

  // TypeScript guard - claim exists at this point
  if (!claim) return null

  return (
    <DetailPageLayout
      title={`Reclamo ${claim.claimNumber}`}
      subtitle={`ID: ${claim.id}`}
      badge={<StatusBadge status={claim.status} />}
      tabs={tabs}
      basePath={`/reclamos/${claimId}`}
      actions={
        <Button
          variant="ghost"
          onClick={() => navigate('/reclamos/atencion')}
          className="flex items-center gap-1 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </Button>
      }
    >
      <Routes>
        <Route index element={<ClaimOverviewTab claim={claim} onRefetch={refetch} />} />
        <Route path="*" element={<Navigate to={`/reclamos/${claimId}`} replace />} />
      </Routes>
    </DetailPageLayout>
  )
}
