/**
 * PolicyDetailSkeleton - Loading placeholder for PolicyDetailView
 */

import { Skeleton } from '../../../../shared/components/ui/Skeleton'

/**
 * Skeleton placeholder matching PolicyDetailView layout
 *
 * Used during initial load of policy detail page.
 * Matches the header with workflow stepper and 2-column grid structure with details card and sidebar cards.
 */
export function PolicyDetailSkeleton() {
  return (
    <div>
      {/* Header Skeleton */}
      <header className="mb-8">
        {/* Back link */}
        <Skeleton className="h-5 w-32 mb-4" />

        {/* Title + Status Badge */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>

        {/* Client Subtitle */}
        <Skeleton className="h-6 w-48 mb-6" />

        {/* Workflow Stepper Card */}
        <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-6 mb-6">
          <Skeleton className="h-6 w-48 mb-4" />
          {/* Desktop: Horizontal stepper */}
          <div className="hidden sm:flex items-center gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-32 rounded-lg" />
                {i < 3 && <Skeleton className="h-4 w-4" />}
              </div>
            ))}
          </div>
          {/* Mobile: Vertical stepper */}
          <div className="sm:hidden space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </header>

      {/* Main Layout: 2-column grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Details Card (2/3) */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-6 space-y-8">
            {/* Section 1: Basic Info */}
            <section>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </section>

            {/* Section 2: Coverage Period */}
            <section>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: Coverage & Copays */}
            <section>
              <Skeleton className="h-6 w-56 mb-4" />
              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-28 mb-2" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Actions Card Skeleton */}
          <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-4">
            <Skeleton className="h-5 w-20 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <div className="border-t border-[var(--color-border)] my-3" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>

          {/* Metadata Card Skeleton */}
          <div className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-4">
            <Skeleton className="h-5 w-40 mb-3" />
            <div className="space-y-3">
              <div>
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div>
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
