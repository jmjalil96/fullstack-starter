/**
 * Hook for fetching affiliates covered under a policy with filters and pagination
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiRequestError } from '../../../config/api'
import { getPolicyAffiliates } from '../../services/policiesApi'
import type { AffiliateType } from '../../types/affiliates'
import type {
  PolicyAffiliateResponse,
  PolicyAffiliatesPagination,
} from '../../types/policies'

interface UseGetPolicyAffiliatesReturn {
  affiliates: PolicyAffiliateResponse[]
  pagination: PolicyAffiliatesPagination | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Fetch affiliates for a given policy with optional filters
 *
 * @param policyId - Policy ID (CUID)
 * @param params - Optional filters (search, affiliateType, isActive, page, limit)
 * @returns Affiliates data, pagination, loading, error and refetch
 */
export function useGetPolicyAffiliates(
  policyId: string,
  params?: {
    search?: string
    affiliateType?: AffiliateType
    isActive?: boolean
    page?: number
    limit?: number
  }
): UseGetPolicyAffiliatesReturn {
  const [affiliates, setAffiliates] = useState<PolicyAffiliateResponse[]>([])
  const [pagination, setPagination] = useState<PolicyAffiliatesPagination | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const key = JSON.stringify({ policyId, ...(params || {}) })

  useEffect(() => {
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)

    const run = async () => {
      try {
        const res = await getPolicyAffiliates(policyId, params, { signal: controller.signal })
        setAffiliates(res.affiliates)
        setPagination(res.pagination)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 403) {
            setError('No tienes permiso para ver afiliados de la póliza')
          } else if (err.statusCode === 401) {
            setError('Debes iniciar sesión')
          } else {
            setError(err.message)
          }
        } else {
          setError('Error al cargar afiliados de la póliza. Intenta de nuevo.')
        }
        setAffiliates([])
        setPagination(null)
      } finally {
        setLoading(false)
      }
    }

    run()
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const refetch = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const res = await getPolicyAffiliates(policyId, params, { signal: controller.signal })
      setAffiliates(res.affiliates)
      setPagination(res.pagination)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      if (err instanceof ApiRequestError) {
        if (err.statusCode === 403) {
          setError('No tienes permiso para ver afiliados de la póliza')
        } else if (err.statusCode === 401) {
          setError('Debes iniciar sesión')
        } else {
          setError(err.message)
        }
      } else {
        setError('Error al cargar afiliados de la póliza. Intenta de nuevo.')
      }
      setAffiliates([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { affiliates, pagination, loading, error, refetch }
}


