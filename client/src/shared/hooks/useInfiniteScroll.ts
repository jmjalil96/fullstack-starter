/**
 * useInfiniteScroll - IntersectionObserver-based infinite scroll hook
 *
 * Uses IntersectionObserver for better performance than scroll events.
 * Returns a ref to attach to a sentinel element at the bottom of the list.
 *
 * @example
 * const sentinelRef = useInfiniteScroll({
 *   onLoadMore: fetchNextPage,
 *   hasNextPage: true,
 *   isFetchingNextPage: false,
 * })
 *
 * return (
 *   <div>
 *     {items.map(item => <Card key={item.id} />)}
 *     <div ref={sentinelRef} /> // Invisible sentinel
 *   </div>
 * )
 */

import { useCallback, useEffect, useRef } from 'react'

interface UseInfiniteScrollOptions {
  /** Callback to load more items */
  onLoadMore: () => void
  /** Whether there are more items to load */
  hasNextPage: boolean
  /** Whether currently fetching next page */
  isFetchingNextPage: boolean
  /** Distance from bottom to trigger load (CSS margin value) */
  rootMargin?: string
}

export function useInfiniteScroll({
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
  rootMargin = '150px',
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Memoize callback to prevent unnecessary re-subscriptions
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        onLoadMore()
      }
    },
    [onLoadMore, hasNextPage, isFetchingNextPage]
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold: 0,
    })

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [handleIntersection, rootMargin])

  return sentinelRef
}
