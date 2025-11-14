/**
 * AffiliateDetailSkeleton - Loading placeholder for AffiliateDetailView
 */

import { Skeleton } from '../../../../shared/components/ui/Skeleton'

/**
 * Skeleton placeholder matching AffiliateDetailView layout
 *
 * Used during initial load of affiliate detail page.
 * Matches the 2-column grid structure with header, details card, metadata card,
 * actions card, and family card for dependents.
 */
export function AffiliateDetailSkeleton() {
  return (
    <div>
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <Skeleton className="h-8 w-2/3 mb-2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Layout: 2-column grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Details Card (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
            <Skeleton className="h-6 w-1/4 mb-6" />

            {/* Field rows */}
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-1/4 mb-2" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Family Card Skeleton (for dependents) */}
          <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-lg">
                  <div className="flex-1">
                    <Skeleton className="h-5 w-1/2 mb-1" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Actions Card Skeleton */}
          <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
            <Skeleton className="h-6 w-2/3 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>

          {/* Metadata Card Skeleton */}
          <div className="bg-white border border-[var(--color-border)] rounded-lg p-6">
            <Skeleton className="h-6 w-2/3 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-1/3 mb-1" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
