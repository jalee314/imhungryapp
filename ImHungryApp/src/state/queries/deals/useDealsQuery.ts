/**
 * state/queries/deals/useDealsQuery.ts
 *
 * React Query hook for fetching the deals feed.
 * Wraps dealService/dealCacheService to provide automatic caching,
 * background refetching, and loading states.
 *
 * @example
 * function FeedScreen() {
 *   const { data: deals, isLoading, error, refetch } = useDealsQuery()
 *
 *   if (isLoading) return <DealCardSkeleton />
 *   if (error) return <ErrorView />
 *
 *   return <DealList deals={deals} />
 * }
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchRankedDeals, transformDealForUI, addVotesToDeals } from '#/services/dealService'
import type { Deal, DatabaseDeal } from '#/types'

// ==========================================
// Query Keys
// ==========================================

/**
 * Query key factory for deals.
 * Follows React Query best practices for key organization.
 */
export const dealsKeys = {
  /** Base key for all deal queries */
  all: ['deals'] as const,

  /** Key for the main feed list */
  feed: () => [...dealsKeys.all, 'feed'] as const,

  /** Key for feed with specific filters */
  feedFiltered: (filters: DealsFilters) => [...dealsKeys.feed(), filters] as const,

  /** Key for a single deal by ID */
  detail: (dealId: string) => [...dealsKeys.all, 'detail', dealId] as const,
}

// ==========================================
// Types
// ==========================================

export interface DealsFilters {
  cuisineId?: string | null
  coordinates?: { lat: number; lng: number } | null
}

// ==========================================
// Query Functions
// ==========================================

/**
 * Fetch deals from the service layer.
 * This is the "queryFn" that React Query calls.
 */
async function fetchDeals(_filters?: DealsFilters): Promise<Deal[]> {
  // Fetch ranked deals from database
  const dbDeals = await fetchRankedDeals()

  if (dbDeals.length === 0) {
    return []
  }

  // Enrich with vote information
  const enrichedDeals = await addVotesToDeals(dbDeals)

  // Transform to UI format
  const transformedDeals = enrichedDeals.map(transformDealForUI)

  return transformedDeals
}

// ==========================================
// Hooks
// ==========================================

/**
 * Hook for fetching the deals feed.
 *
 * Features:
 * - Automatic caching (5 min stale time)
 * - Background refetching
 * - Loading and error states
 * - Pull-to-refresh support via refetch()
 *
 * @param filters - Optional filters (cuisineId, coordinates)
 * @param options - Additional React Query options
 *
 * @example
 * // Basic usage
 * const { data: deals, isLoading } = useDealsQuery()
 *
 * @example
 * // With filters
 * const { data: deals } = useDealsQuery({
 *   cuisineId: 'italian',
 *   coordinates: { lat: 34.05, lng: -118.24 }
 * })
 *
 * @example
 * // Pull-to-refresh
 * const { refetch, isRefetching } = useDealsQuery()
 * onRefresh={() => refetch()}
 */
export function useDealsQuery(filters?: DealsFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: filters ? dealsKeys.feedFiltered(filters) : dealsKeys.feed(),
    queryFn: () => fetchDeals(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook for prefetching deals (useful for navigation).
 * Call this to warm the cache before the user navigates.
 *
 * @example
 * const prefetchDeals = usePrefetchDeals()
 * // On hover or anticipating navigation:
 * prefetchDeals()
 */
export function usePrefetchDeals() {
  const queryClient = useQueryClient()

  return (filters?: DealsFilters) => {
    queryClient.prefetchQuery({
      queryKey: filters ? dealsKeys.feedFiltered(filters) : dealsKeys.feed(),
      queryFn: () => fetchDeals(filters),
      staleTime: 5 * 60 * 1000,
    })
  }
}

/**
 * Hook to invalidate deals cache.
 * Use after mutations that affect the feed.
 *
 * @example
 * const invalidateDeals = useInvalidateDeals()
 * // After creating a deal:
 * await createDeal(data)
 * invalidateDeals()
 */
export function useInvalidateDeals() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: dealsKeys.all })
  }
}
