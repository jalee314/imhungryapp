/**
 * state/queries/restaurants/useRestaurantsQuery.ts
 *
 * React Query hooks for fetching restaurant data.
 * Wraps discoverService for the discover feed.
 *
 * @example
 * function DiscoverScreen() {
 *   const { data, isLoading } = useRestaurantsQuery()
 *   // data.restaurants contains the list
 * }
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getRestaurantsWithDeals,
  type DiscoverResult,
  type DiscoverRestaurant,
} from '#/services/discoverService'

// ==========================================
// Query Keys
// ==========================================

/**
 * Query key factory for restaurant queries.
 */
export const restaurantsKeys = {
  /** Base key for all restaurant queries */
  all: ['restaurants'] as const,

  /** Key for the discover feed list */
  discover: () => [...restaurantsKeys.all, 'discover'] as const,

  /** Key for discover with specific coordinates */
  discoverAt: (coords: { lat: number; lng: number }) =>
    [...restaurantsKeys.discover(), coords] as const,

  /** Key for a single restaurant detail */
  detail: (restaurantId: string) =>
    [...restaurantsKeys.all, 'detail', restaurantId] as const,
}

// ==========================================
// Types
// ==========================================

export interface RestaurantsQueryParams {
  /** Custom coordinates for distance calculation */
  coordinates?: { lat: number; lng: number }
}

// ==========================================
// Hooks
// ==========================================

/**
 * Hook for fetching restaurants with deals (discover feed).
 *
 * Returns restaurants sorted by distance, with deal counts
 * and the most liked deal's image for each.
 *
 * @param params - Optional coordinates for distance calculation
 *
 * @example
 * // Use user's current location
 * const { data, isLoading, refetch } = useRestaurantsQuery()
 *
 * @example
 * // Use custom location
 * const { data } = useRestaurantsQuery({
 *   coordinates: { lat: 34.05, lng: -118.24 }
 * })
 */
export function useRestaurantsQuery(params?: RestaurantsQueryParams) {
  const queryKey = params?.coordinates
    ? restaurantsKeys.discoverAt(params.coordinates)
    : restaurantsKeys.discover()

  return useQuery({
    queryKey,
    queryFn: () => getRestaurantsWithDeals(params?.coordinates),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data: DiscoverResult) => ({
      restaurants: data.restaurants,
      count: data.count,
      error: data.error,
    }),
  })
}

/**
 * Hook to get just the restaurants list (convenience wrapper).
 *
 * @example
 * const restaurants = useRestaurantsList()
 * // Returns DiscoverRestaurant[] directly
 */
export function useRestaurantsList(params?: RestaurantsQueryParams): DiscoverRestaurant[] {
  const { data } = useRestaurantsQuery(params)
  return data?.restaurants ?? []
}

/**
 * Hook to invalidate restaurant cache.
 * Use when restaurants data might have changed.
 *
 * @example
 * const invalidateRestaurants = useInvalidateRestaurants()
 * invalidateRestaurants()
 */
export function useInvalidateRestaurants() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: restaurantsKeys.all })
  }
}

/**
 * Hook for prefetching restaurants (useful before navigation).
 *
 * @example
 * const prefetch = usePrefetchRestaurants()
 * prefetch({ coordinates: { lat: 34.05, lng: -118.24 } })
 */
export function usePrefetchRestaurants() {
  const queryClient = useQueryClient()

  return (params?: RestaurantsQueryParams) => {
    const queryKey = params?.coordinates
      ? restaurantsKeys.discoverAt(params.coordinates)
      : restaurantsKeys.discover()

    queryClient.prefetchQuery({
      queryKey,
      queryFn: () => getRestaurantsWithDeals(params?.coordinates),
      staleTime: 5 * 60 * 1000,
    })
  }
}
