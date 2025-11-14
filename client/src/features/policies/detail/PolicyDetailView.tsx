/**
 * PolicyDetailView - Main view for policy detail page
 * Uses DetailPageLayout with tab navigation
 */

import { useMemo } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import { DetailPageLayout } from '../../../shared/components/DetailPageLayout'
import { Button } from '../../../shared/components/ui/Button'
import { useGetPolicyDetail } from '../../../shared/hooks/policies/useGetPolicyDetail'
import { getPolicyTabs } from '../../../shared/utils/detailTabs'
import { StatusBadge } from '../views/components/StatusBadge'

import { PolicyDetailSkeleton } from './components'
import { PolicyOverviewTab, PolicyAffiliatesTab } from './tabs'

/**
 * Props for PolicyDetailView component
 */
interface PolicyDetailViewProps {
  /** Policy ID from route params */
  policyId: string
}

/**
 * PolicyDetailView - Complete policy detail page orchestrator
 *
 * Features:
 * - DetailPageLayout with tab navigation
 * - Fetches and displays policy data
 * - Tab-based organization (Overview, Documents, Activity)
 * - Loading/error states
 * - Auto-refetch after updates
 *
 * @example
 * function PolizaDetallePage() {
 *   const { id } = useParams()
 *   return <PolicyDetailView policyId={id!} />
 * }
 */
export function PolicyDetailView({ policyId }: PolicyDetailViewProps) {
  const navigate = useNavigate()

  // Fetch policy data
  const { policy, error, refetch } = useGetPolicyDetail(policyId)

  // Generate tabs (guard for null; counts optional)
  const tabs = useMemo(() => {
    if (!policy) return [{ label: 'Resumen', path: '' }]
    return getPolicyTabs(policy, { affiliates: undefined, claims: undefined, invoices: undefined })
  }, [policy])

  // Loading state - show skeleton if no data and no error
  if (!policy && !error) {
    return <PolicyDetailSkeleton />
  }

  // Error state (includes 404 not found)
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium mb-2">Error al cargar póliza</p>
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

  // TypeScript guard - policy exists at this point
  if (!policy) return null

  return (
    <DetailPageLayout
      title={policy.policyNumber}
      subtitle={`ID: ${policy.id}`}
      badge={<StatusBadge status={policy.status} />}
      tabs={tabs}
      basePath={`/clientes/polizas/${policyId}`}
      actions={
        <Button
          variant="ghost"
          onClick={() => navigate('/clientes/polizas')}
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
        <Route index element={<PolicyOverviewTab policy={policy} onRefetch={refetch} />} />
        <Route path="afiliados" element={<PolicyAffiliatesTab policyId={policy.id} />} />
        <Route path="*" element={<Navigate to={`/clientes/polizas/${policyId}`} replace />} />
      </Routes>
    </DetailPageLayout>
  )
}
