import { supabase } from '../../lib/supabase';
import { getCurrentDatabaseSessionId } from './sessionService';

// Interaction types matching your enum
export type InteractionType = 
  | 'impression'
  | 'click'
  | 'upvote'
  | 'downvote'
  | 'save'
  | 'favorite'
  | 'redemption_proxy'
  | 'report'
  | 'block';

/**
 * Get the current authenticated user's ID
 */
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Log an interaction to the database
 */
export const logInteraction = async (
  dealId: string,
  interactionType: InteractionType,
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
        source: 'community_uploaded',
        position_in_feed: positionInFeed || null,
        dwell_time: dwellTime || null,
      });

    if (error) {
      console.error('Error logging interaction:', error);
      return false;
    }

    console.log(`✅ ${interactionType} logged for deal ${dealId}`);
    return true;
  } catch (error) {
    console.error('Error in logInteraction:', error);
    return false;
  }
};

/**
 * Log a click interaction when user opens a deal
 */
export const logClick = async (dealId: string, positionInFeed?: number): Promise<boolean> => {
  return await logInteraction(dealId, 'click', positionInFeed);
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
