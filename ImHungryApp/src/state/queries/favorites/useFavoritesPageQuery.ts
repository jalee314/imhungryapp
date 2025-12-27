/**
 * state/queries/favorites/useFavoritesPageQuery.ts
 *
 * React Query hook for the Favorites page with realtime support.
 * Handles both deals and restaurants tabs with optimistic updates.
 *
 * Features:
 * - Separate queries for deals and restaurants
 * - Realtime subscription for instant updates
 * - Optimistic unfavorite with rollback
 * - Pull-to-refresh support
 * - Image preloading for smooth scrolling
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../../../../lib/supabase'
import {
  fetchFavoriteDeals,
  fetchFavoriteRestaurants,
  clearFavoritesCache,
  toggleRestaurantFavorite,
  FavoriteDeal,
  FavoriteRestaurant,
} from '../../../services/favoritesService'
import { toggleFavorite } from '../../../services/voteService'
import { preloadFeedImages } from '../../../lib/imagePreloader'

// ==========================================
// Query Keys
// ==========================================

export const favoritesKeys = {
  all: ['favorites'] as const,
  deals: () => [...favoritesKeys.all, 'deals'] as const,
  restaurants: () => [...favoritesKeys.all, 'restaurants'] as const,
}

// ==========================================
// Types
// ==========================================

export interface UseFavoritesPageQueryResult {
  // Data
  deals: FavoriteDeal[]
  restaurants: FavoriteRestaurant[]
  // Loading states
  isDealsLoading: boolean
  isRestaurantsLoading: boolean
  isRefreshing: boolean
  // Error states
  dealsError: Error | null
  restaurantsError: Error | null
  // Actions
  refetchDeals: () => Promise<void>
  refetchRestaurants: () => Promise<void>
  onRefresh: (tab: 'deals' | 'restaurants') => Promise<void>
  // Optimistic updates
  removeDealOptimistic: (dealId: string) => void
  removeRestaurantOptimistic: (restaurantId: string) => void
  // Mutations
  unfavoriteDeal: (dealId: string) => Promise<void>
  unfavoriteRestaurant: (restaurantId: string) => Promise<void>
}

// ==========================================
// Hook
// ==========================================

export function useFavoritesPageQuery(): UseFavoritesPageQueryResult {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Realtime channel ref
  const favoriteChannel = useRef<RealtimeChannel | null>(null)
  const currentUserIdRef = useRef<string | null>(null)

  // ==========================================
  // Queries
  // ==========================================

  const {
    data: deals = [],
    isLoading: isDealsLoading,
    error: dealsError,
    refetch: refetchDealsQuery,
  } = useQuery({
    queryKey: favoritesKeys.deals(),
    queryFn: fetchFavoriteDeals,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const {
    data: restaurants = [],
    isLoading: isRestaurantsLoading,
    error: restaurantsError,
    refetch: refetchRestaurantsQuery,
  } = useQuery({
    queryKey: favoritesKeys.restaurants(),
    queryFn: fetchFavoriteRestaurants,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Preload images when favorites are loaded
  useEffect(() => {
    if (deals.length > 0) {
      const preloadableItems = deals.map((deal) => ({
        imageUrl: deal.imageUrl,
        userProfilePhoto: deal.userProfilePhoto,
      }))
      preloadFeedImages(preloadableItems, { batchSize: 5, batchDelay: 50 })
    }
  }, [deals])

  useEffect(() => {
    if (restaurants.length > 0) {
      const preloadableItems = restaurants.map((r) => ({
        imageUrl: r.imageUrl,
      }))
      preloadFeedImages(preloadableItems, { batchSize: 5, batchDelay: 50 })
    }
  }, [restaurants])

  // ==========================================
  // Realtime Subscription
  // ==========================================

  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      currentUserIdRef.current = user.id

      // Clean up existing channel
      if (favoriteChannel.current) {
        supabase.removeChannel(favoriteChannel.current)
      }

      favoriteChannel.current = supabase
        .channel(`favorites-page-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'favorite',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: any) => {
            const dealId = payload.new?.deal_id || payload.old?.deal_id
            const restaurantId = payload.new?.restaurant_id || payload.old?.restaurant_id

            if (payload.eventType === 'DELETE') {
              // Optimistically remove from cache
              if (dealId) {
                queryClient.setQueryData<FavoriteDeal[]>(
                  favoritesKeys.deals(),
                  (old) => old?.filter((d) => d.id !== dealId) ?? []
                )
              }
              if (restaurantId) {
                queryClient.setQueryData<FavoriteRestaurant[]>(
                  favoritesKeys.restaurants(),
                  (old) => old?.filter((r) => r.id !== restaurantId) ?? []
                )
              }
            } else if (payload.eventType === 'INSERT') {
              // Invalidate to refetch with full data
              if (dealId) {
                queryClient.invalidateQueries({ queryKey: favoritesKeys.deals() })
              }
              if (restaurantId) {
                queryClient.invalidateQueries({ queryKey: favoritesKeys.restaurants() })
              }
            }
          }
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (favoriteChannel.current) {
        supabase.removeChannel(favoriteChannel.current)
      }
    }
  }, [queryClient])

  // ==========================================
  // Refetch Helpers
  // ==========================================

  const refetchDeals = useCallback(async () => {
    clearFavoritesCache()
    await refetchDealsQuery()
  }, [refetchDealsQuery])

  const refetchRestaurants = useCallback(async () => {
    clearFavoritesCache()
    await refetchRestaurantsQuery()
  }, [refetchRestaurantsQuery])

  const onRefresh = useCallback(
    async (tab: 'deals' | 'restaurants') => {
      setIsRefreshing(true)
      try {
        clearFavoritesCache()
        if (tab === 'deals') {
          await refetchDealsQuery()
        } else {
          await refetchRestaurantsQuery()
        }
      } finally {
        setIsRefreshing(false)
      }
    },
    [refetchDealsQuery, refetchRestaurantsQuery]
  )

  // ==========================================
  // Optimistic Updates
  // ==========================================

  const removeDealOptimistic = useCallback(
    (dealId: string) => {
      queryClient.setQueryData<FavoriteDeal[]>(favoritesKeys.deals(), (old) =>
        old?.filter((d) => d.id !== dealId) ?? []
      )
    },
    [queryClient]
  )

  const removeRestaurantOptimistic = useCallback(
    (restaurantId: string) => {
      queryClient.setQueryData<FavoriteRestaurant[]>(
        favoritesKeys.restaurants(),
        (old) => old?.filter((r) => r.id !== restaurantId) ?? []
      )
    },
    [queryClient]
  )

  // ==========================================
  // Mutations
  // ==========================================

  const unfavoriteDeal = useCallback(
    async (dealId: string) => {
      // Store original for rollback
      const original = queryClient.getQueryData<FavoriteDeal[]>(favoritesKeys.deals())

      // Optimistic update
      removeDealOptimistic(dealId)

      try {
        await toggleFavorite(dealId, true) // true = was favorited, now unfavorite
      } catch (error) {
        // Rollback on error
        if (original) {
          queryClient.setQueryData(favoritesKeys.deals(), original)
        }
        throw error
      }
    },
    [queryClient, removeDealOptimistic]
  )

  const unfavoriteRestaurant = useCallback(
    async (restaurantId: string) => {
      // Store original for rollback
      const original = queryClient.getQueryData<FavoriteRestaurant[]>(
        favoritesKeys.restaurants()
      )

      // Optimistic update
      removeRestaurantOptimistic(restaurantId)

      try {
        await toggleRestaurantFavorite(restaurantId, true) // true = was favorited
      } catch (error) {
        // Rollback on error
        if (original) {
          queryClient.setQueryData(favoritesKeys.restaurants(), original)
        }
        throw error
      }
    },
    [queryClient, removeRestaurantOptimistic]
  )

  return {
    deals,
    restaurants,
    isDealsLoading,
    isRestaurantsLoading,
    isRefreshing,
    dealsError: dealsError as Error | null,
    restaurantsError: restaurantsError as Error | null,
    refetchDeals,
    refetchRestaurants,
    onRefresh,
    removeDealOptimistic,
    removeRestaurantOptimistic,
    unfavoriteDeal,
    unfavoriteRestaurant,
  }
}
