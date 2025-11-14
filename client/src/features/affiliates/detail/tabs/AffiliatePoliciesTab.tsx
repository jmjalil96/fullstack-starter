/**
 * AffiliatePoliciesTab - Displays policies covering this affiliate
 */

/**
 * Props for AffiliatePoliciesTab
 */
interface AffiliatePoliciesTabProps {
  /** Affiliate ID to fetch policies for */
  affiliateId: string
}

/**
 * AffiliatePoliciesTab - Shows list of policies that cover this affiliate
 *
 * TODO: Implement with GET /api/affiliates/:id/policies endpoint when available
 * For now shows placeholder message.
 *
 * @example
 * <AffiliatePoliciesTab affiliateId={affiliate.id} />
 */
export function AffiliatePoliciesTab({ affiliateId }: AffiliatePoliciesTabProps) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-[var(--color-navy)] mb-4">Pólizas del Afiliado</h2>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-base font-medium text-[var(--color-navy)] mb-2">
          Pólizas
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-1">
          Pendiente de implementar
        </p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Aquí se mostrarán las pólizas que cubren a este afiliado
        </p>
        <p className="text-xs text-gray-400 mt-4">
          Affiliate ID: {affiliateId}
        </p>
      </div>
    </div>
  )
}
