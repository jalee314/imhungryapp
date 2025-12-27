/**
 * state/queries/deals/useFeedQuery.ts
 *
 * React Query hook for the main deals feed with realtime subscription support.
 * Follows Bluesky's pattern: Query for data, realtime for invalidation.
 *
 * Features:
 * - Automatic caching and background refetching
 * - Realtime subscription that invalidates query on changes
 * - Optimistic updates for votes/favorites
 * - Pull-to-refresh support
 *
 * @example
 * function FeedScreen() {
 *   const {
 *     deals,
 *     isLoading,
 *     isRefreshing,
 *     refetch,
 *     onRefresh,
 *     updateDealOptimistic,
 *   } = useFeedQuery({ coordinates: selectedCoordinates })
 * }
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../../../../lib/supabase'
import { fetchRankedDeals, transformDealForUI, addVotesToDeals } from '../../../services/dealService'
import { calculateVoteCounts } from '../../../services/voteService'
import type { Deal } from '../../../types/deals'
import { dealsKeys } from './useDealsQuery'

// ==========================================
// Types
// ==========================================

export interface UseFeedQueryParams {
  /** Custom coordinates for distance calculation */
  coordinates?: { lat: number; lng: number } | null
  /** Whether the query should be enabled */
  enabled?: boolean
}

export interface UseFeedQueryResult {
  /** The deals list */
  deals: Deal[]
  /** True during initial load */
  isLoading: boolean
  /** True during pull-to-refresh */
  isRefreshing: boolean
  /** Error if fetch failed */
  error: Error | null
  /** Refetch the data */
  refetch: () => Promise<void>
  /** Pull-to-refresh handler */
  onRefresh: () => Promise<void>
  /** Optimistically update a deal in the cache */
  updateDealOptimistic: (dealId: string, updates: Partial<Deal>) => void
  /** Revert an optimistic update */
  revertDealOptimistic: (dealId: string, original: Deal) => void
}

// ==========================================
// Query Function
// ==========================================

async function fetchFeedDeals(_coordinates?: { lat: number; lng: number } | null): Promise<Deal[]> {
  const dbDeals = await fetchRankedDeals()

  if (dbDeals.length === 0) {
    return []
  }

  // Enrich with vote information
  const enrichedDeals = await addVotesToDeals(dbDeals)

  // Transform to UI format
  return enrichedDeals.map(transformDealForUI)
}

// ==========================================
// Hook
// ==========================================

/**
 * Hook for the main deals feed with realtime support.
 *
 * This follows Bluesky's pattern:
 * 1. Use React Query for data fetching and caching
 * 2. Use Supabase realtime to INVALIDATE the query (not set state directly)
 * 3. Optimistic updates happen via queryClient.setQueryData
 */
export function useFeedQuery(params?: UseFeedQueryParams): UseFeedQueryResult {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Refs for realtime channels
  const interactionChannel = useRef<RealtimeChannel | null>(null)
  const favoriteChannel = useRef<RealtimeChannel | null>(null)
  const dealChannel = useRef<RealtimeChannel | null>(null)
  const recentActions = useRef<Set<string>>(new Set())
  const currentUserIdRef = useRef<string | null>(null)

  // Query key includes coordinates for proper cache separation
  const queryKey = params?.coordinates
    ? [...dealsKeys.feed(), params.coordinates]
    : dealsKeys.feed()

  // Main query
  const {
    data: deals = [],
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchFeedDeals(params?.coordinates),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: params?.enabled ?? true,
  })

  // Setup realtime subscriptions
  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      currentUserIdRef.current = user.id

      // Clean up existing channels
      if (interactionChannel.current) {
        supabase.removeChannel(interactionChannel.current)
      }
      if (favoriteChannel.current) {
        supabase.removeChannel(favoriteChannel.current)
      }
      if (dealChannel.current) {
        supabase.removeChannel(dealChannel.current)
      }

      // Interaction channel - for vote count updates from OTHER users
      interactionChannel.current = supabase
        .channel('feed-interactions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'interaction' },
          async (payload: any) => {
            const interaction = payload.new || payload.old

            // Skip clicks
            if (interaction.interaction_type === 'click') return

            // Skip own actions (optimistic updates handle those)
            if (interaction.user_id === currentUserIdRef.current) return

            // Debounce repeated updates
            const actionKey = `${interaction.deal_id}-${interaction.interaction_type}`
            if (recentActions.current.has(actionKey)) return
            recentActions.current.add(actionKey)
            setTimeout(() => recentActions.current.delete(actionKey), 1000)

            // Update just the vote count for this deal
            const changedDealId = interaction.deal_id
            const voteCounts = await calculateVoteCounts([changedDealId])

            queryClient.setQueryData<Deal[]>(queryKey, (oldDeals) => {
              if (!oldDeals) return oldDeals
              return oldDeals.map((deal) =>
                deal.id === changedDealId
                  ? { ...deal, votes: voteCounts[changedDealId] ?? deal.votes }
                  : deal
              )
            })
          }
        )
        .subscribe()

      // Favorite channel - for user's own favorites (realtime sync)
      favoriteChannel.current = supabase
        .channel('feed-favorites')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'favorite', filter: `user_id=eq.${user.id}` },
          (payload: any) => {
            const dealId = payload.new?.deal_id || payload.old?.deal_id
            const isFavorited = payload.eventType === 'INSERT'

            queryClient.setQueryData<Deal[]>(queryKey, (oldDeals) => {
              if (!oldDeals) return oldDeals
              return oldDeals.map((deal) =>
                deal.id === dealId ? { ...deal, isFavorited } : deal
              )
            })
          }
        )
        .subscribe()

      // Deal channel - invalidate on new deals or deletions
      dealChannel.current = supabase
        .channel('feed-deals')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'deal_instance' },
          () => {
            // New deal added - invalidate to refetch
            queryClient.invalidateQueries({ queryKey: dealsKeys.feed() })
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'deal_instance' },
          () => {
            // Deal deleted - invalidate to refetch
            queryClient.invalidateQueries({ queryKey: dealsKeys.feed() })
          }
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (interactionChannel.current) supabase.removeChannel(interactionChannel.current)
      if (favoriteChannel.current) supabase.removeChannel(favoriteChannel.current)
      if (dealChannel.current) supabase.removeChannel(dealChannel.current)
      recentActions.current.clear()
    }
  }, [queryClient, queryKey])

  // Refetch wrapper
  const refetch = useCallback(async () => {
    await queryRefetch()
  }, [queryRefetch])

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await queryRefetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [queryRefetch])

  // Optimistic update helper
  const updateDealOptimistic = useCallback(
    (dealId: string, updates: Partial<Deal>) => {
      queryClient.setQueryData<Deal[]>(queryKey, (oldDeals) => {
        if (!oldDeals) return oldDeals
        return oldDeals.map((deal) =>
          deal.id === dealId ? { ...deal, ...updates } : deal
        )
      })
    },
    [queryClient, queryKey]
  )

  // Revert optimistic update
  const revertDealOptimistic = useCallback(
    (dealId: string, original: Deal) => {
      queryClient.setQueryData<Deal[]>(queryKey, (oldDeals) => {
        if (!oldDeals) return oldDeals
        return oldDeals.map((deal) => (deal.id === dealId ? original : deal))
      })
    },
    [queryClient, queryKey]
  )

  return {
    deals,
    isLoading,
    isRefreshing,
    error: error as Error | null,
    refetch,
    onRefresh,
    updateDealOptimistic,
    revertDealOptimistic,
  }
}
