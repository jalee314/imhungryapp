import { supabase } from '../../lib/supabase';
import { getCurrentDatabaseSessionId } from './sessionService';
import { getCurrentUserId } from '../utils/authUtils';

export interface RestaurantFavoriteResult {
  success: boolean;
  error?: string;
}

/**
 * Check if a restaurant is favorited by the current user
 */
export const isRestaurantFavorited = async (restaurantId: string): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { data, error } = await supabase
      .from('favorite')
      .select('favorite_id')
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .is('deal_id', null) // Only restaurant favorites (no deal_id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking restaurant favorite status:', error);
      return false;
    }

    return !!data;
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
  onOptimisticUpdate?: (isFavorited: boolean) => void
): Promise<RestaurantFavoriteResult> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Optimistic UI update - immediately show as favorited
    onOptimisticUpdate?.(true);

    const sessionId = await getCurrentDatabaseSessionId();
    if (!sessionId) {
      return { success: false, error: 'Unable to track interaction' };
    }

    // Check if already favorited
    const alreadyFavorited = await isRestaurantFavorited(restaurantId);
    if (alreadyFavorited) {
      return { success: true }; // Already favorited, no action needed
    }

    // Add to favorites table
    const { error: insertError } = await supabase
      .from('favorite')
      .insert({
        user_id: userId,
        restaurant_id: restaurantId,
        deal_id: null, // Restaurant favorite (no deal)
      });

    if (insertError) {
      console.error('Error adding restaurant to favorites:', insertError);
      // Revert optimistic update on error
      onOptimisticUpdate?.(false);
      return { success: false, error: 'Failed to add to favorites' };
    }

    // Log the favorite interaction (don't fail the whole operation if this fails)
    try {
      await supabase
        .from('interaction')
        .insert({
          user_id: userId,
          session_id: sessionId,
          interaction_type: 'favorite',
          source: 'search',
          restaurant_id: restaurantId,
        });
    } catch (interactionError) {
      console.error('Error logging restaurant favorite interaction:', interactionError);
      // Don't fail the whole operation if interaction logging fails
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding restaurant to favorites:', error);
    // Revert optimistic update on error
    onOptimisticUpdate?.(false);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Remove a restaurant from favorites with optimistic UI updates
 */
export const removeRestaurantFromFavorites = async (
  restaurantId: string,
  onOptimisticUpdate?: (isFavorited: boolean) => void
): Promise<RestaurantFavoriteResult> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Optimistic UI update - immediately show as unfavorited
    onOptimisticUpdate?.(false);

    const sessionId = await getCurrentDatabaseSessionId();
    if (!sessionId) {
      return { success: false, error: 'Unable to track interaction' };
    }

    // Remove from favorites table
    const { error: deleteError } = await supabase
      .from('favorite')
      .delete()
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .is('deal_id', null);

    if (deleteError) {
      console.error('Error removing restaurant from favorites:', deleteError);
      // Revert optimistic update on error
      onOptimisticUpdate?.(true);
      return { success: false, error: 'Failed to remove from favorites' };
    }

    // Log the unfavorite interaction (don't fail the whole operation if this fails)
    try {
      await supabase
        .from('interaction')
        .insert({
          user_id: userId,
          session_id: sessionId,
          interaction_type: 'favorite',
          source: 'search',
          restaurant_id: restaurantId,
        });
    } catch (interactionError) {
      console.error('Error logging restaurant unfavorite interaction:', interactionError);
      // Don't fail the whole operation if interaction logging fails
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing restaurant from favorites:', error);
    // Revert optimistic update on error
    onOptimisticUpdate?.(true);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Toggle restaurant favorite status with immediate client-side updates
 */
export const toggleRestaurantFavorite = async (
  restaurantId: string,
  currentState: boolean, // Pass the current state from component
  onOptimisticUpdate?: (isFavorited: boolean) => void
): Promise<{ success: boolean; isFavorited: boolean; error?: string }> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, isFavorited: currentState, error: 'User not authenticated' };
    }

    const sessionId = await getCurrentDatabaseSessionId();
    if (!sessionId) {
      return { success: false, isFavorited: currentState, error: 'Unable to track interaction' };
    }

    // IMMEDIATE client-side update - no database check needed
    const newState = !currentState;
    onOptimisticUpdate?.(newState);

    // Perform the database operation in the background
    if (currentState) {
      // Currently favorited, so remove it
      const { error: deleteError } = await supabase
        .from('favorite')
        .delete()
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)
        .is('deal_id', null);

      if (deleteError) {
        console.error('Error removing restaurant from favorites:', deleteError);
        // Revert optimistic update on error
        onOptimisticUpdate?.(currentState);
        return { success: false, isFavorited: currentState, error: 'Failed to remove from favorites' };
      }

      // Log the unfavorite interaction (non-blocking)
      try {
        await supabase
          .from('interaction')
          .insert({
            user_id: userId,
            session_id: sessionId,
            interaction_type: 'favorite',
            source: 'search',
            restaurant_id: restaurantId,
          });
      } catch (interactionError) {
        console.error('Error logging restaurant unfavorite interaction:', interactionError);
      }

      return { success: true, isFavorited: false };
    } else {
      // Currently not favorited, so add it
      const { error: insertError } = await supabase
        .from('favorite')
        .insert({
          user_id: userId,
          restaurant_id: restaurantId,
          deal_id: null, // Restaurant favorite (no deal)
        });

      if (insertError) {
        console.error('Error adding restaurant to favorites:', insertError);
        // Revert optimistic update on error
        onOptimisticUpdate?.(currentState);
        return { success: false, isFavorited: currentState, error: 'Failed to add to favorites' };
      }

      // Log the favorite interaction (non-blocking)
      try {
        await supabase
          .from('interaction')
          .insert({
            user_id: userId,
            session_id: sessionId,
            interaction_type: 'favorite',
            source: 'search',
            restaurant_id: restaurantId,
          });
      } catch (interactionError) {
        console.error('Error logging restaurant favorite interaction:', interactionError);
      }

      return { success: true, isFavorited: true };
    }
  } catch (error) {
    console.error('Error toggling restaurant favorite:', error);
    // Revert optimistic update on error
    onOptimisticUpdate?.(currentState);
    return { success: false, isFavorited: currentState, error: 'An unexpected error occurred' };
  }
};
