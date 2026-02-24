/**
 * Favorites Service (Facade)
 *
 * Public API for favorites-related operations. This service maintains
 * backward compatibility with existing callers while the underlying logic
 * is decomposed into focused modules in src/services/favorites.
 */

import { toggleRestaurantFavorite as canonicalToggleRestaurantFavorite } from '../features/interactions';
import type { FavoriteDeal, FavoriteRestaurant } from '../types/favorites';
import {
  estimatePayloadBytes,
  recordCacheAccess,
  recordCacheRefresh,
  startPerfSpan,
} from '../utils/perfMonitor';

import { getCurrentUserId } from './currentUserService';
import { fetchFavoriteDealsFromDatabase } from './favorites/deals';
import { fetchFavoriteRestaurantsFromDatabase } from './favorites/restaurants';

export type { FavoriteDeal, FavoriteRestaurant } from '../types/favorites';

type FavoriteCacheType = 'deals' | 'restaurants';

export interface FavoritesFetchOptions {
  forceRefresh?: boolean;
}

interface FavoritesCache {
  restaurants: Map<string, FavoriteRestaurant[]>;
  deals: Map<string, FavoriteDeal[]>;
  lastFetch: Map<string, number>;
  dirtyEntries: Set<string>;
  CACHE_DURATION: number;
}

// Simple cache to avoid redundant queries
const cache: FavoritesCache = {
  restaurants: new Map<string, FavoriteRestaurant[]>(),
  deals: new Map<string, FavoriteDeal[]>(),
  lastFetch: new Map<string, number>(),
  dirtyEntries: new Set<string>(),
  CACHE_DURATION: 30000, // 30 seconds
};

const FAVORITES_DEALS_CACHE_METRIC = 'favorites_deals_cache';
const FAVORITES_RESTAURANTS_CACHE_METRIC = 'favorites_restaurants_cache';

const buildCacheKey = (type: FavoriteCacheType, userId: string): string => `${type}_${userId}`;

const isCacheEntryFresh = (cacheKey: string, now: number): boolean => {
  const lastFetch = cache.lastFetch.get(cacheKey) || 0;
  const isExpired = now - lastFetch >= cache.CACHE_DURATION;
  const isDirty = cache.dirtyEntries.has(cacheKey);
  return !isExpired && !isDirty;
};

/**
 * Clear the favorites cache to force fresh data on next fetch.
 */
export const clearFavoritesCache = (): void => {
  cache.restaurants.clear();
  cache.deals.clear();
  cache.lastFetch.clear();
  cache.dirtyEntries.clear();
};

export const markFavoritesCacheDirty = (type?: FavoriteCacheType): void => {
  cache.lastFetch.forEach((_value, key) => {
    if (!type || key.startsWith(`${type}_`)) {
      cache.dirtyEntries.add(key);
    }
  });
};

export const isFavoritesCacheStale = async (type: FavoriteCacheType): Promise<boolean> => {
  const userId = await getCurrentUserId();
  if (!userId) return true;

  const cacheKey = buildCacheKey(type, userId);
  if (type === 'deals' && !cache.deals.has(cacheKey)) return true;
  if (type === 'restaurants' && !cache.restaurants.has(cacheKey)) return true;
  return !isCacheEntryFresh(cacheKey, Date.now());
};

const cacheDealsResult = (
  cacheKey: string,
  favoriteDeals: FavoriteDeal[],
  refreshStartedAt: number,
  refreshReason: 'manual' | 'stale' | 'miss',
): FavoriteDeal[] => {
  cache.deals.set(cacheKey, favoriteDeals);
  cache.lastFetch.set(cacheKey, Date.now());
  cache.dirtyEntries.delete(cacheKey);
  recordCacheRefresh(FAVORITES_DEALS_CACHE_METRIC, {
    durationMs: Date.now() - refreshStartedAt,
    payloadBytes: estimatePayloadBytes(favoriteDeals),
    triggeredBy: refreshReason,
  });
  return favoriteDeals;
};

const cacheRestaurantsResult = (
  cacheKey: string,
  restaurants: FavoriteRestaurant[],
  refreshStartedAt: number,
  refreshReason: 'manual' | 'stale' | 'miss',
): FavoriteRestaurant[] => {
  cache.restaurants.set(cacheKey, restaurants);
  cache.lastFetch.set(cacheKey, Date.now());
  cache.dirtyEntries.delete(cacheKey);
  recordCacheRefresh(FAVORITES_RESTAURANTS_CACHE_METRIC, {
    durationMs: Date.now() - refreshStartedAt,
    payloadBytes: estimatePayloadBytes(restaurants),
    triggeredBy: refreshReason,
  });
  return restaurants;
};

/**
 * Fetch user's favorite deals.
 */
export const fetchFavoriteDeals = async (
  options: FavoritesFetchOptions = {},
): Promise<FavoriteDeal[]> => {
  const span = startPerfSpan('screen.favorites.fetch_deals');

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      span.end({
        metadata: {
          reason: 'no_authenticated_user',
          deals: 0,
        },
      });
      return [];
    }

    const cacheKey = buildCacheKey('deals', userId);
    const now = Date.now();
    const cachedDeals = cache.deals.get(cacheKey);
    const canUseCachedDeals =
      !options.forceRefresh && Boolean(cachedDeals) && isCacheEntryFresh(cacheKey, now);

    if (canUseCachedDeals && cachedDeals) {
      recordCacheAccess(FAVORITES_DEALS_CACHE_METRIC, {
        hit: true,
        stale: false,
        source: 'memory',
      });
      span.addPayload(cachedDeals);
      span.end({
        metadata: {
          cacheHit: true,
          deals: cachedDeals.length,
        },
      });
      return cachedDeals;
    }

    const staleCachedDeals = Boolean(cachedDeals);
    recordCacheAccess(FAVORITES_DEALS_CACHE_METRIC, {
      hit: false,
      stale: staleCachedDeals,
      source: staleCachedDeals ? 'memory' : 'none',
    });

    const refreshReason: 'manual' | 'stale' | 'miss' = options.forceRefresh
      ? 'manual'
      : staleCachedDeals
        ? 'stale'
        : 'miss';
    const refreshStartedAt = Date.now();

    const favoriteDeals = await fetchFavoriteDealsFromDatabase(userId, span);
    const cached = cacheDealsResult(cacheKey, favoriteDeals, refreshStartedAt, refreshReason);

    span.addPayload(cached);
    span.end({
      metadata: {
        cacheHit: false,
        deals: cached.length,
      },
    });

    return cached;
  } catch (error) {
    console.error('Error in fetchFavoriteDeals:', error);
    span.end({ success: false, error });
    return [];
  }
};

/**
 * Fetch user's favorite restaurants (restaurants with favorited deals).
 */
export const fetchFavoriteRestaurants = async (
  options: FavoritesFetchOptions = {},
): Promise<FavoriteRestaurant[]> => {
  const span = startPerfSpan('screen.favorites.fetch_restaurants');

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      span.end({
        metadata: {
          reason: 'no_authenticated_user',
          restaurants: 0,
        },
      });
      return [];
    }

    const cacheKey = buildCacheKey('restaurants', userId);
    const now = Date.now();
    const cachedRestaurants = cache.restaurants.get(cacheKey);
    const canUseCachedRestaurants =
      !options.forceRefresh && Boolean(cachedRestaurants) && isCacheEntryFresh(cacheKey, now);

    if (canUseCachedRestaurants && cachedRestaurants) {
      recordCacheAccess(FAVORITES_RESTAURANTS_CACHE_METRIC, {
        hit: true,
        stale: false,
        source: 'memory',
      });
      span.addPayload(cachedRestaurants);
      span.end({
        metadata: {
          cacheHit: true,
          restaurants: cachedRestaurants.length,
        },
      });
      return cachedRestaurants;
    }

    const staleCachedRestaurants = Boolean(cachedRestaurants);
    recordCacheAccess(FAVORITES_RESTAURANTS_CACHE_METRIC, {
      hit: false,
      stale: staleCachedRestaurants,
      source: staleCachedRestaurants ? 'memory' : 'none',
    });

    const refreshReason: 'manual' | 'stale' | 'miss' = options.forceRefresh
      ? 'manual'
      : staleCachedRestaurants
        ? 'stale'
        : 'miss';
    const refreshStartedAt = Date.now();

    const restaurants = await fetchFavoriteRestaurantsFromDatabase(userId, span);
    const cached = cacheRestaurantsResult(cacheKey, restaurants, refreshStartedAt, refreshReason);

    span.addPayload(cached);
    span.end({
      metadata: {
        cacheHit: false,
        restaurants: cached.length,
      },
    });

    return cached;
  } catch (error) {
    console.error('Error in fetchFavoriteRestaurants:', error);
    span.end({ success: false, error });
    return [];
  }
};

/**
 * Toggle restaurant favorite status.
 */
export const toggleRestaurantFavorite = async (
  restaurantId: string,
  isCurrentlyFavorited: boolean,
): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId({ forceRefresh: true });
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const result = await canonicalToggleRestaurantFavorite(
      restaurantId,
      isCurrentlyFavorited,
      'favorites',
    );

    if (!result.success) {
      throw { message: result.error || 'Failed to toggle restaurant favorite' };
    }

    markFavoritesCacheDirty('restaurants');
    return result.isFavorited ?? !isCurrentlyFavorited;
  } catch (error) {
    console.error('Error toggling restaurant favorite:', error);
    throw error;
  }
};
