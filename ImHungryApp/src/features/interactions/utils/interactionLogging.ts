/**
 * Interactions Feature - Interaction Logging Utilities
 *
 * Centralized utilities for logging interactions to the database.
 * These are the low-level interaction logging functions used by mutations.
 */

import { supabase } from '../../../../lib/supabase';
import { getCurrentDatabaseSessionId } from '../../../services/sessionService';
import {
  InteractionType,
  InteractionSource,
  InteractionLogParams,
  InteractionLogResult,
} from '../types';
import { getCurrentUserId } from '../selectors/voteSelectors';

// ==========================================
// Interaction Logging
// ==========================================

/**
 * Log an interaction event to the database
 */
export const logInteractionEvent = async (
  params: InteractionLogParams
): Promise<InteractionLogResult> => {
  try {
    const { dealId, restaurantId, interactionType, source = 'feed', positionInFeed, dwellTime } =
      params;

    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const sessionId = await getCurrentDatabaseSessionId();
    if (!sessionId) {
      console.warn('[interactions/logging] No session ID available for interaction');
      return { success: false, error: 'No session available' };
    }

    const insertData: Record<string, any> = {
      user_id: userId,
      session_id: sessionId,
      interaction_type: interactionType,
      source: source,
    };

    // Add optional fields
    if (dealId) {
      insertData.deal_id = dealId;
    }
    if (restaurantId) {
      insertData.restaurant_id = restaurantId;
    }
    if (positionInFeed !== undefined) {
      insertData.position_in_feed = positionInFeed;
    }
    if (dwellTime !== undefined) {
      insertData.dwell_time = dwellTime;
    }

    const { error } = await supabase.from('interaction').insert(insertData);

    if (error) {
      console.error('[interactions/logging] Error logging interaction:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ ${interactionType} logged for ${dealId || restaurantId} from ${source}`);
    return { success: true };
  } catch (error) {
    console.error('[interactions/logging] Error in logInteractionEvent:', error);
    return { success: false, error: 'Failed to log interaction' };
  }
};

// ==========================================
// Convenience Logging Functions
// ==========================================

/**
 * Log a click interaction when user opens a deal
 */
export const logClickEvent = async (
  dealId: string,
  source: InteractionSource = 'feed',
  positionInFeed?: number
): Promise<InteractionLogResult> => {
  return logInteractionEvent({
    dealId,
    interactionType: 'click-open',
    source,
    positionInFeed,
  });
};

/**
 * Log a share interaction when user shares a deal
 */
export const logShareEvent = async (
  dealId: string,
  source: InteractionSource = 'feed'
): Promise<InteractionLogResult> => {
  return logInteractionEvent({
    dealId,
    interactionType: 'share',
    source,
  });
};

/**
 * Log a click-through interaction when user clicks directions/map
 */
export const logClickThroughEvent = async (
  dealId: string,
  source: InteractionSource = 'feed'
): Promise<InteractionLogResult> => {
  return logInteractionEvent({
    dealId,
    interactionType: 'click-through',
    source,
  });
};

/**
 * Log a favorite interaction
 */
export const logFavoriteEvent = async (
  dealId: string,
  source: InteractionSource = 'feed'
): Promise<InteractionLogResult> => {
  return logInteractionEvent({
    dealId,
    interactionType: 'favorite',
    source,
  });
};

/**
 * Log a restaurant favorite interaction
 */
export const logRestaurantFavoriteEvent = async (
  restaurantId: string,
  source: InteractionSource = 'search'
): Promise<InteractionLogResult> => {
  return logInteractionEvent({
    restaurantId,
    interactionType: 'favorite',
    source,
  });
};

// ==========================================
// Interaction Removal
// ==========================================

/**
 * Remove favorite interactions for a deal when unfavoriting
 */
export const removeFavoriteInteractionsForDeal = async (
  dealId: string
): Promise<InteractionLogResult> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('interaction')
      .delete()
      .eq('user_id', userId)
      .eq('deal_id', dealId)
      .eq('interaction_type', 'favorite');

    if (error) {
      console.error('[interactions/logging] Error removing favorite interactions:', error);
      return { success: false, error: error.message };
    }

    console.log(`🗑️ Favorite interactions removed for deal ${dealId}`);
    return { success: true };
  } catch (error) {
    console.error('[interactions/logging] Error in removeFavoriteInteractionsForDeal:', error);
    return { success: false, error: 'Failed to remove favorite interactions' };
  }
};
