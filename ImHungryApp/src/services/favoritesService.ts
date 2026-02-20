/**
 * Favorites Service (Facade)
 *
 * Public API for favorites-related operations. This service maintains
 * backward compatibility with existing callers while the underlying logic
 * is consolidated into focused favorites modules.
 */

import { supabase } from '../../lib/supabase';
import type { FavoriteDeal, FavoriteRestaurant } from '../types/favorites';
import { logger } from '../utils/logger';

import {
  favoritesCache,
  getDealsCacheKey,
  getRestaurantsCacheKey,
} from './favorites/cache';
import { fetchFavoriteDealsForUser } from './favorites/fetchFavoriteDeals';
import { fetchFavoriteRestaurantsForUser } from './favorites/fetchFavoriteRestaurants';

export type { FavoriteDeal, FavoriteRestaurant } from '../types/favorites';

/**
 * Clear the favorites cache to force fresh data on next fetch
 */
export const clearFavoritesCache = () => {
  favoritesCache.restaurants.clear();
  favoritesCache.deals.clear();
  favoritesCache.lastFetch.clear();
  logger.info('🗑️ Favorites cache cleared');
};

/**
 * Get the current authenticated user's ID
 */
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    logger.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Fetch user's favorite deals
 */
export const fetchFavoriteDeals = async (): Promise<FavoriteDeal[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return [];
    }

    return await fetchFavoriteDealsForUser(userId);
  } catch (error) {
    logger.error('Error in fetchFavoriteDeals:', error);
    return [];
  }
};

/**
 * Fetch user's favorite restaurants (restaurants with favorited deals)
 */
export const fetchFavoriteRestaurants = async (): Promise<FavoriteRestaurant[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return [];
    }

    return await fetchFavoriteRestaurantsForUser(userId);
  } catch (error) {
    logger.error('Error in fetchFavoriteRestaurants:', error);
    return [];
  }
};

/**
 * Toggle restaurant favorite status
 */
export const toggleRestaurantFavorite = async (
  restaurantId: string,
  isCurrentlyFavorited: boolean
): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (isCurrentlyFavorited) {
      const { error } = await supabase
        .from('favorite')
        .delete()
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId);

      if (error) {
        throw error;
      }

      favoritesCache.restaurants.delete(getRestaurantsCacheKey(userId));
      favoritesCache.deals.delete(getDealsCacheKey(userId));
      favoritesCache.lastFetch.delete(getRestaurantsCacheKey(userId));
      favoritesCache.lastFetch.delete(getDealsCacheKey(userId));
      return false;
    }

    const { error } = await supabase
      .from('favorite')
      .insert({
        user_id: userId,
        restaurant_id: restaurantId,
      });

    if (error) {
      throw error;
    }

    favoritesCache.restaurants.delete(getRestaurantsCacheKey(userId));
    favoritesCache.deals.delete(getDealsCacheKey(userId));
    favoritesCache.lastFetch.delete(getRestaurantsCacheKey(userId));
    favoritesCache.lastFetch.delete(getDealsCacheKey(userId));
    return true;
  } catch (error) {
    logger.error('Error toggling restaurant favorite:', error);
    throw error;
  }
};
