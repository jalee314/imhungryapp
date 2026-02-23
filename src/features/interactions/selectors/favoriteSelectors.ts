/**
 * Interactions Feature - Favorite Selectors
 *
 * Centralized selectors for querying favorite states.
 * These selectors encapsulate the data fetching logic for determining
 * if deals or restaurants are favorited by the current user.
 */

import { supabase } from '../../../../lib/supabase';
import { getCurrentUserId } from '../../../services/currentUserService';
import {
  FavoriteState,
  FavoriteTargetType,
  createDefaultFavoriteState,
} from '../types';

// ==========================================
// Deal Favorite Selectors
// ==========================================

/**
 * Check if a deal is favorited by the current user
 */
export const selectDealFavoriteState = async (
  dealId: string,
  userId?: string
): Promise<FavoriteState> => {
  try {
    const effectiveUserId = userId || (await getCurrentUserId());
    if (!effectiveUserId) {
      return createDefaultFavoriteState();
    }

    const { data, error } = await supabase
      .from('favorite')
      .select('favorite_id, created_at')
      .eq('user_id', effectiveUserId)
      .eq('deal_id', dealId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (not an error for this use case)
      console.error('[interactions/selectors] Error checking deal favorite status:', error);
      return createDefaultFavoriteState();
    }

    return {
      isFavorited: !!data,
      favoritedAt: data?.created_at,
    };
  } catch (error) {
    console.error('[interactions/selectors] Error checking deal favorite status:', error);
    return createDefaultFavoriteState();
  }
};

/**
 * Get favorite states for multiple deals
 */
export const selectDealFavoriteStates = async (
  dealIds: string[],
  userId?: string
): Promise<Record<string, FavoriteState>> => {
  try {
    const effectiveUserId = userId || (await getCurrentUserId());
    if (!effectiveUserId || dealIds.length === 0) {
      return {};
    }

    const { data: favorites, error } = await supabase
      .from('favorite')
      .select('deal_id, created_at')
      .eq('user_id', effectiveUserId)
      .in('deal_id', dealIds);

    if (error) {
      console.error('[interactions/selectors] Error fetching deal favorites:', error);
      return {};
    }

    // Initialize all deals as not favorited
    const favoriteStates: Record<string, FavoriteState> = {};
    dealIds.forEach((dealId) => {
      favoriteStates[dealId] = createDefaultFavoriteState();
    });

    // Mark favorited deals
    favorites?.forEach((fav) => {
      if (fav.deal_id) {
        favoriteStates[fav.deal_id] = {
          isFavorited: true,
          favoritedAt: fav.created_at,
        };
      }
    });

    return favoriteStates;
  } catch (error) {
    console.error('[interactions/selectors] Error fetching deal favorites:', error);
    return {};
  }
};

// ==========================================
// Restaurant Favorite Selectors
// ==========================================

/**
 * Check if a restaurant is favorited by the current user
 */
export const selectRestaurantFavoriteState = async (
  restaurantId: string,
  userId?: string
): Promise<FavoriteState> => {
  try {
    const effectiveUserId = userId || (await getCurrentUserId());
    if (!effectiveUserId) {
      return createDefaultFavoriteState();
    }

    const { data, error } = await supabase
      .from('favorite')
      .select('favorite_id, created_at')
      .eq('user_id', effectiveUserId)
      .eq('restaurant_id', restaurantId)
      .is('deal_id', null) // Restaurant favorite only (no deal_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[interactions/selectors] Error checking restaurant favorite status:', error);
      return createDefaultFavoriteState();
    }

    return {
      isFavorited: !!data,
      favoritedAt: data?.created_at,
    };
  } catch (error) {
    console.error('[interactions/selectors] Error checking restaurant favorite status:', error);
    return createDefaultFavoriteState();
  }
};

/**
 * Get favorite states for multiple restaurants
 */
export const selectRestaurantFavoriteStates = async (
  restaurantIds: string[],
  userId?: string
): Promise<Record<string, FavoriteState>> => {
  try {
    const effectiveUserId = userId || (await getCurrentUserId());
    if (!effectiveUserId || restaurantIds.length === 0) {
      return {};
    }

    const { data: favorites, error } = await supabase
      .from('favorite')
      .select('restaurant_id, created_at')
      .eq('user_id', effectiveUserId)
      .in('restaurant_id', restaurantIds)
      .is('deal_id', null);

    if (error) {
      console.error('[interactions/selectors] Error fetching restaurant favorites:', error);
      return {};
    }

    // Initialize all restaurants as not favorited
    const favoriteStates: Record<string, FavoriteState> = {};
    restaurantIds.forEach((restaurantId) => {
      favoriteStates[restaurantId] = createDefaultFavoriteState();
    });

    // Mark favorited restaurants
    favorites?.forEach((fav) => {
      if (fav.restaurant_id) {
        favoriteStates[fav.restaurant_id] = {
          isFavorited: true,
          favoritedAt: fav.created_at,
        };
      }
    });

    return favoriteStates;
  } catch (error) {
    console.error('[interactions/selectors] Error fetching restaurant favorites:', error);
    return {};
  }
};

// ==========================================
// Generic Favorite Selector
// ==========================================

/**
 * Get favorite state for any target type (deal or restaurant)
 */
export const selectFavoriteState = async (
  targetId: string,
  targetType: FavoriteTargetType,
  userId?: string
): Promise<FavoriteState> => {
  if (targetType === 'deal') {
    return selectDealFavoriteState(targetId, userId);
  } else {
    return selectRestaurantFavoriteState(targetId, userId);
  }
};
