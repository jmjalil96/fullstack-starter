/**
 * AfiliadoDetalle - Thin page wrapper for affiliate detail view
 */

import { useParams } from 'react-router-dom'

import { AffiliateDetailView } from '../../features/affiliates/detail/AffiliateDetailView'

/**
 * AfiliadoDetalle page - Delegates to AffiliateDetailView
 * Extracts affiliateId from route params
 */
export function AfiliadoDetalle() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">ID de afiliado no proporcionado</p>
      </div>
    )
  }

  return <AffiliateDetailView affiliateId={id} />
}
