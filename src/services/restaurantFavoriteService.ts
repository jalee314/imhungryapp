/**
 * Restaurant Favorite Service (Facade)
 *
 * Public API for restaurant favorite operations. This service preserves
 * compatibility for existing callers while delegating to the canonical
 * interactions domain implementation.
 */

import {
  addRestaurantToFavorites as canonicalAddRestaurantToFavorites,
  removeRestaurantFromFavorites as canonicalRemoveRestaurantFromFavorites,
  selectRestaurantFavoriteState,
  toggleRestaurantFavorite as canonicalToggleRestaurantFavorite,
} from '../features/interactions';

import { getCurrentUserId } from './currentUserService';

export interface RestaurantFavoriteResult {
  success: boolean;
  error?: string;
}

/**
 * Check if a restaurant is favorited by the current user
 */
export const isRestaurantFavorited = async (restaurantId: string): Promise<boolean> => {
  try {
    const state = await selectRestaurantFavoriteState(restaurantId);
    return state.isFavorited;
  } catch (error) {
    console.error('Error checking restaurant favorite status:', error);
    return false;
  }
};

/**
 * Add a restaurant to favorites with optimistic UI updates
 */
export const addRestaurantToFavorites = async (
  restaurantId: string,
  onOptimisticUpdate?: (isFavorited: boolean) => void,
): Promise<RestaurantFavoriteResult> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    onOptimisticUpdate?.(true);

    const result = await canonicalAddRestaurantToFavorites(restaurantId, 'search');
    if (!result.success) {
      onOptimisticUpdate?.(false);
      return { success: false, error: result.error || 'Failed to add to favorites' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding restaurant to favorites:', error);
    onOptimisticUpdate?.(false);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Remove a restaurant from favorites with optimistic UI updates
 */
export const removeRestaurantFromFavorites = async (
  restaurantId: string,
  onOptimisticUpdate?: (isFavorited: boolean) => void,
): Promise<RestaurantFavoriteResult> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    onOptimisticUpdate?.(false);

    const result = await canonicalRemoveRestaurantFromFavorites(restaurantId);
    if (!result.success) {
      onOptimisticUpdate?.(true);
      return { success: false, error: result.error || 'Failed to remove from favorites' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing restaurant from favorites:', error);
    onOptimisticUpdate?.(true);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Toggle restaurant favorite status with immediate client-side updates
 */
export const toggleRestaurantFavorite = async (
  restaurantId: string,
  currentState: boolean,
  onOptimisticUpdate?: (isFavorited: boolean) => void,
): Promise<{ success: boolean; isFavorited: boolean; error?: string }> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, isFavorited: currentState, error: 'User not authenticated' };
    }

    const optimisticState = !currentState;
    onOptimisticUpdate?.(optimisticState);

    const result = await canonicalToggleRestaurantFavorite(
      restaurantId,
      currentState,
      'search',
    );

    if (!result.success) {
      onOptimisticUpdate?.(currentState);
      return {
        success: false,
        isFavorited: currentState,
        error: result.error || 'Failed to toggle favorite',
      };
    }

    const persistedState = result.isFavorited ?? optimisticState;
    if (persistedState !== optimisticState) {
      onOptimisticUpdate?.(persistedState);
    }

    return { success: true, isFavorited: persistedState };
  } catch (error) {
    console.error('Error toggling restaurant favorite:', error);
    onOptimisticUpdate?.(currentState);
    return { success: false, isFavorited: currentState, error: 'An unexpected error occurred' };
  }
};
