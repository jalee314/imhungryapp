/**
 * Interactions Feature - Favorite Mutations
 *
 * Centralized mutations for favorite operations (deals and restaurants).
 * These mutations encapsulate the state modification logic and
 * can be used by the service layer.
 */

import { supabase } from '../../../../lib/supabase';
import { getCurrentUserId } from '../selectors/voteSelectors';
import {
  FavoriteMutationResult,
  FavoriteTargetType,
  InteractionSource,
} from '../types';
import {
  logFavoriteEvent,
  logRestaurantFavoriteEvent,
  removeFavoriteInteractionsForDeal,
} from '../utils/interactionLogging';

// ==========================================
// Deal Favorite Mutations
// ==========================================

/**
 * Add a deal to favorites
 */
export const addDealToFavorites = async (
  dealId: string,
  source: InteractionSource = 'feed'
): Promise<FavoriteMutationResult> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Add to favorites table
    const { error } = await supabase.from('favorite').insert({
      user_id: userId,
      deal_id: dealId,
    });

    if (error) {
      console.error('[interactions/mutations] Error adding deal to favorites:', error);
      return { success: false, error: error.message };
    }

    // Log the favorite interaction (non-blocking)
    await logFavoriteEvent(dealId, source);

    console.log('✅ Deal favorite added successfully');
    return { success: true, isFavorited: true };
  } catch (error) {
    console.error('[interactions/mutations] Error adding deal to favorites:', error);
    return { success: false, error: 'Failed to add to favorites' };
  }
};

/**
 * Remove a deal from favorites
 */
export const removeDealFromFavorites = async (dealId: string): Promise<FavoriteMutationResult> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Remove from favorites table
    const { error } = await supabase
      .from('favorite')
      .delete()
      .eq('user_id', userId)
      .eq('deal_id', dealId);

    if (error) {
      console.error('[interactions/mutations] Error removing deal from favorites:', error);
      return { success: false, error: error.message };
    }

    // Also remove favorite interactions
    await removeFavoriteInteractionsForDeal(dealId);

    console.log('✅ Deal favorite removed successfully');
    return { success: true, isFavorited: false };
  } catch (error) {
    console.error('[interactions/mutations] Error removing deal from favorites:', error);
    return { success: false, error: 'Failed to remove from favorites' };
  }
};

/**
 * Toggle deal favorite status
 */
export const toggleDealFavorite = async (
  dealId: string,
  currentlyFavorited: boolean,
  source: InteractionSource = 'feed'
): Promise<FavoriteMutationResult> => {
  if (currentlyFavorited) {
    return removeDealFromFavorites(dealId);
  } else {
    return addDealToFavorites(dealId, source);
  }
};

// ==========================================
// Restaurant Favorite Mutations
// ==========================================

/**
 * Add a restaurant to favorites
 */
export const addRestaurantToFavorites = async (
  restaurantId: string,
  source: InteractionSource = 'search'
): Promise<FavoriteMutationResult> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Add to favorites table (restaurant favorite has no deal_id)
    const { error } = await supabase.from('favorite').insert({
      user_id: userId,
      restaurant_id: restaurantId,
      deal_id: null,
    });

    if (error) {
      console.error('[interactions/mutations] Error adding restaurant to favorites:', error);
      return { success: false, error: error.message };
    }

    // Log the favorite interaction (non-blocking)
    await logRestaurantFavoriteEvent(restaurantId, source);

    console.log('✅ Restaurant favorite added successfully');
    return { success: true, isFavorited: true };
  } catch (error) {
    console.error('[interactions/mutations] Error adding restaurant to favorites:', error);
    return { success: false, error: 'Failed to add to favorites' };
  }
};

/**
 * Remove a restaurant from favorites
 */
export const removeRestaurantFromFavorites = async (
  restaurantId: string
): Promise<FavoriteMutationResult> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Remove from favorites table
    const { error } = await supabase
      .from('favorite')
      .delete()
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .is('deal_id', null);

    if (error) {
      console.error('[interactions/mutations] Error removing restaurant from favorites:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Restaurant favorite removed successfully');
    return { success: true, isFavorited: false };
  } catch (error) {
    console.error('[interactions/mutations] Error removing restaurant from favorites:', error);
    return { success: false, error: 'Failed to remove from favorites' };
  }
};

/**
 * Toggle restaurant favorite status
 */
export const toggleRestaurantFavorite = async (
  restaurantId: string,
  currentlyFavorited: boolean,
  source: InteractionSource = 'search'
): Promise<FavoriteMutationResult> => {
  if (currentlyFavorited) {
    return removeRestaurantFromFavorites(restaurantId);
  } else {
    return addRestaurantToFavorites(restaurantId, source);
  }
};

// ==========================================
// Generic Favorite Mutation
// ==========================================

/**
 * Toggle favorite status for any target type
 */
export const toggleFavorite = async (
  targetId: string,
  targetType: FavoriteTargetType,
  currentlyFavorited: boolean,
  source: InteractionSource = 'feed'
): Promise<FavoriteMutationResult> => {
  if (targetType === 'deal') {
    return toggleDealFavorite(targetId, currentlyFavorited, source);
  } else {
    return toggleRestaurantFavorite(targetId, currentlyFavorited, source);
  }
};
