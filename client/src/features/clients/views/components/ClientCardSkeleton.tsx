/**
 * ClientCardSkeleton - Loading placeholder for ClientCard
 */

import { Skeleton } from '../../../../shared/components/ui/Skeleton'

/**
 * Skeleton placeholder matching ClientCard layout
 *
 * Used during initial load of clients list.
 * Matches the structure of ClientCard for smooth loading UX.
 */
export function ClientCardSkeleton() {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-lg p-5">
      {/* Header: Name + TaxID */}
      <div className="mb-3">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Contact Info: Email + Phone placeholders */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>

      {/* Footer: Date + Badge */}
      <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}
