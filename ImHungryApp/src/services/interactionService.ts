import { supabase } from '../../lib/supabase';
import { getCurrentDatabaseSessionId } from './sessionService';
import { getCurrentUserId } from '../utils/authUtils';

// Interaction types matching your enum
export type InteractionType = 
  | 'impression'
  | 'click-open'
  | 'click-through'
  | 'upvote'
  | 'downvote'
  | 'save'
  | 'favorite'
  | 'redemption_proxy'
  | 'report'
  | 'block'
  | 'share';

// Source types for interactions
export type InteractionSource = 
  | 'feed'
  | 'search'
  | 'favorites'
  | 'profile'
  | 'discover';

// Note: getCurrentUserId is now imported from authUtils

/**
 * Log an interaction to the database
 */
export const logInteraction = async (
  dealId: string,
  interactionType: InteractionType,
  source: InteractionSource = 'feed',
  positionInFeed?: number,
  dwellTime?: number
): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const sessionId = await getCurrentDatabaseSessionId();
    if (!sessionId) {
      console.warn('No session ID available for interaction');
      return false;
    }

    const { error } = await supabase
      .from('interaction')
      .insert({
        user_id: userId,
        deal_id: dealId,
        session_id: sessionId,
        interaction_type: interactionType,
        source: source,
        position_in_feed: positionInFeed || null,
        dwell_time: dwellTime || null,
      });

    if (error) {
      console.error('Error logging interaction:', error);
      return false;
    }

    console.log(`✅ ${interactionType} logged for deal ${dealId} from ${source}`);
    return true;
  } catch (error) {
    console.error('Error in logInteraction:', error);
    return false;
  }
};

/**
 * Log a click interaction when user opens a deal
 */
export const logClick = async (dealId: string, source: InteractionSource = 'feed', positionInFeed?: number): Promise<boolean> => {
  return await logInteraction(dealId, 'click-open', source, positionInFeed);
};

/**
 * Log a share interaction when user shares a deal
 */
export const logShare = async (dealId: string, source: InteractionSource = 'feed'): Promise<boolean> => {
  return await logInteraction(dealId, 'share', source);
};

/**
 * Log a click-through interaction when user clicks directions/map
 */
export const logClickThrough = async (dealId: string, source: InteractionSource = 'feed'): Promise<boolean> => {
  return await logInteraction(dealId, 'click-through', source);
};

/**
 * Remove favorite interactions for a deal when unfavoriting
 */
export const removeFavoriteInteractions = async (dealId: string): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from('interaction')
      .delete()
      .eq('user_id', userId)
      .eq('deal_id', dealId)
      .eq('interaction_type', 'favorite');

    if (error) {
      console.error('Error removing favorite interactions:', error);
      return false;
    }

    console.log(`🗑️ Favorite interactions removed for deal ${dealId}`);
    return true;
  } catch (error) {
    console.error('Error in removeFavoriteInteractions:', error);
    return false;
  }
};

/**
 * Get the view count for a deal (count of click interactions)
 */
export const getDealViewCount = async (dealId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('interaction')
      .select('*', { count: 'exact', head: true })
      .eq('deal_id', dealId)
      .eq('interaction_type', 'click-open');

    if (error) {
      console.error('Error fetching view count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getDealViewCount:', error);
    return 0;
  }
};

/**
 * Get view counts for multiple deals at once (more efficient)
 */
export const getDealViewCounts = async (dealIds: string[]): Promise<Record<string, number>> => {
  try {
    if (dealIds.length === 0) return {};

    const { data, error } = await supabase
      .from('interaction')
      .select('deal_id')
      .in('deal_id', dealIds)
      .eq('interaction_type', 'click-open');

    if (error) {
      console.error('Error fetching view counts:', error);
      return {};
    }

    // Count clicks per deal
    const viewCounts: Record<string, number> = {};
    dealIds.forEach(id => viewCounts[id] = 0);
    
    data?.forEach(interaction => {
      viewCounts[interaction.deal_id] = (viewCounts[interaction.deal_id] || 0) + 1;
    });

    return viewCounts;
  } catch (error) {
    console.error('Error in getDealViewCounts:', error);
    return {};
  }
};
