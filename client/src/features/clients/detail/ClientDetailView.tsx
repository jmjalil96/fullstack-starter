/**
 * ClientDetailView - Main detail view with tab navigation
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import { DetailPageLayout } from '../../../shared/components/DetailPageLayout'
import { Button } from '../../../shared/components/ui/Button'
import { useGetClientDetail } from '../../../shared/hooks/clients/useGetClientDetail'
import { getClientTabs } from '../../../shared/utils/detailTabs'
import { IsActiveBadge } from '../views/components/IsActiveBadge'

import { ClientDetailSkeleton } from './components'
import { ClientOverviewTab } from './tabs'

/**
 * Props for ClientDetailView component
 */
interface ClientDetailViewProps {
  /** Client ID from route params */
  clientId: string
}

/**
 * ClientDetailView - Orchestrates client detail page with tab navigation
 *
 * Features:
 * - Tab-based navigation (Resumen, Pólizas, Afiliados, Facturas)
 * - Responsive sidebar (vertical pills on desktop, dropdown on mobile)
 * - Parallel data fetching (client + counts)
 * - Nested routing for tabs
 *
 * @example
 * <ClientDetailView clientId="abc123" />
 */
export function ClientDetailView({ clientId }: ClientDetailViewProps) {
  const navigate = useNavigate()

  // Fetch client data
  const { client, error, refetch } = useGetClientDetail(clientId)

  // Count data for tab badges
  const [counts, setCounts] = useState<{ policies?: number; affiliates?: number; invoices?: number }>({})
  const countsAbort = useRef<AbortController | null>(null)

  /**
   * Fetch count data in parallel when client loads
   * Uses AbortController for cleanup
   */
  useEffect(() => {
    if (!client) return

    // Abort previous request
    countsAbort.current?.abort()
    const controller = new AbortController()
    countsAbort.current = controller

    // TODO: Fetch counts when endpoints available
    // const fetchCounts = async () => {
    //   try {
    //     const [policiesResponse, affiliatesResponse, invoicesResponse] = await Promise.all([
    //       getPolicies({ clientId: client.id, limit: 1 }, { signal: controller.signal }),
    //       getAffiliates({ clientId: client.id, limit: 1 }, { signal: controller.signal }),
    //       getInvoices({ clientId: client.id, limit: 1 }, { signal: controller.signal })
    //     ])
    //     setCounts({
    //       policies: policiesResponse.total,
    //       affiliates: affiliatesResponse.total,
    //       invoices: invoicesResponse.total
    //     })
    //   } catch (err) {
    //     if (err instanceof Error && err.name !== 'AbortError') {
    //       console.warn('Failed to fetch client counts:', err)
    //     }
    //   }
    // }
    // fetchCounts()

    setCounts({ policies: undefined, affiliates: undefined, invoices: undefined })

    return () => controller.abort()
  }, [client?.id, client])

  /**
   * Compute tabs based on client data and counts
   */
  const tabs = useMemo(() => {
    if (!client) return []
    return getClientTabs(client, counts)
  }, [client, counts])

  const basePath = `/clientes/${clientId}`

  // Loading state - show skeleton layout
  if (!client && !error) {
    return <ClientDetailSkeleton />
  }

  // Error state (includes 404 not found)
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium mb-2">Error al cargar cliente</p>
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

  // TypeScript guard - client exists at this point
  if (!client) return null

  return (
    <DetailPageLayout
      title={client.name}
      subtitle={`ID: ${client.id}`}
      badge={<IsActiveBadge isActive={client.isActive} />}
      tabs={tabs}
      basePath={basePath}
      actions={
        <Button
          variant="ghost"
          onClick={() => navigate('/clientes/lista')}
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
          element={<ClientOverviewTab client={client} onRefetch={refetch} />}
        />

        {/* Fallback: redirect to overview */}
        <Route path="*" element={<Navigate to={basePath} replace />} />
      </Routes>
    </DetailPageLayout>
  )
}
