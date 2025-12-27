/**
 * state/queries/favorites/useFavoritesQuery.ts
 *
 * React Query hooks for fetching and managing user favorites.
 * Handles both deal and restaurant favorites.
 *
 * @example
 * function FavoritesScreen() {
 *   const { data: deals, isLoading } = useFavoriteDealsQuery()
 *   const { data: restaurants } = useFavoriteRestaurantsQuery()
 * }
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchFavoriteDeals,
  fetchFavoriteRestaurants,
  toggleRestaurantFavorite,
  clearFavoritesCache,
  type FavoriteDeal,
  type FavoriteRestaurant,
} from '#/services/favoritesService'
import { dealsKeys } from '../deals'

// ==========================================
// Query Keys
// ==========================================

/**
 * Query key factory for favorites queries.
 */
export const favoritesKeys = {
  /** Base key for all favorites queries */
  all: ['favorites'] as const,

  /** Key for favorite deals list */
  deals: () => [...favoritesKeys.all, 'deals'] as const,

  /** Key for favorite restaurants list */
  restaurants: () => [...favoritesKeys.all, 'restaurants'] as const,
}

// ==========================================
// Query Hooks
// ==========================================

/**
 * Hook for fetching user's favorite deals.
 *
 * @example
 * const { data: deals, isLoading, refetch } = useFavoriteDealsQuery()
 */
export function useFavoriteDealsQuery() {
  return useQuery({
    queryKey: favoritesKeys.deals(),
    queryFn: fetchFavoriteDeals,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching user's favorite restaurants.
 *
 * @example
 * const { data: restaurants, isLoading } = useFavoriteRestaurantsQuery()
 */
export function useFavoriteRestaurantsQuery() {
  return useQuery({
    queryKey: favoritesKeys.restaurants(),
    queryFn: fetchFavoriteRestaurants,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// ==========================================
// Mutation Hooks
// ==========================================

interface ToggleRestaurantFavoriteParams {
  restaurantId: string
  isCurrentlyFavorited: boolean
}

/**
 * Hook for toggling a restaurant's favorite status.
 *
 * Automatically invalidates favorites cache on success.
 *
 * @example
 * const { mutate: toggleFavorite, isPending } = useToggleRestaurantFavorite()
 *
 * toggleFavorite({
 *   restaurantId: 'rest-123',
 *   isCurrentlyFavorited: false
 * })
 */
export function useToggleRestaurantFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ restaurantId, isCurrentlyFavorited }: ToggleRestaurantFavoriteParams) =>
      toggleRestaurantFavorite(restaurantId, isCurrentlyFavorited),
    onSuccess: () => {
      // Invalidate favorites cache
      queryClient.invalidateQueries({ queryKey: favoritesKeys.restaurants() })
    },
  })
}

// ==========================================
// Cache Utilities
// ==========================================

/**
 * Hook to invalidate all favorites cache.
 * Use when favorites might have changed externally.
 *
 * @example
 * const invalidateFavorites = useInvalidateFavorites()
 * invalidateFavorites()
 */
export function useInvalidateFavorites() {
  const queryClient = useQueryClient()

  return () => {
    // Clear service-level cache
    clearFavoritesCache()
    // Invalidate React Query cache
    queryClient.invalidateQueries({ queryKey: favoritesKeys.all })
  }
}

/**
 * Hook to check if a deal is favorited.
 * Uses local query data for instant response.
 *
 * @param dealId - The deal ID to check
 *
 * @example
 * const isFavorited = useIsDealFavorited('deal-123')
 */
export function useIsDealFavorited(dealId: string): boolean {
  const { data: favorites } = useFavoriteDealsQuery()

  if (!favorites) return false
  return favorites.some((fav) => fav.id === dealId)
}

/**
 * Hook to check if a restaurant is favorited.
 *
 * @param restaurantId - The restaurant ID to check
 */
export function useIsRestaurantFavorited(restaurantId: string): boolean {
  const { data: favorites } = useFavoriteRestaurantsQuery()

  if (!favorites) return false
  return favorites.some((fav) => fav.id === restaurantId)
}
