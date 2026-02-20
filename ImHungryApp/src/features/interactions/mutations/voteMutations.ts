/**
 * Interactions Feature - Vote Mutations
 *
 * Centralized mutations for vote operations (upvote, downvote).
 * These mutations encapsulate the state modification logic and
 * can be used by the service layer.
 */

import { supabase } from '../../../../lib/supabase';
import { logger } from '../../../utils/logger';
import { getCurrentUserId } from '../selectors/voteSelectors';
import {
  VoteType,
  VoteMutationResult,
  MutationResult,
  InteractionSource,
} from '../types';
import { logInteractionEvent } from '../utils/interactionLogging';

// ==========================================
// Vote Mutation Helpers
// ==========================================

/**
 * Get the current vote for a deal (latest upvote or downvote interaction)
 */
export const getCurrentVote = async (
  dealId: string,
  userId?: string
): Promise<{ interactionId: string; voteType: VoteType } | null> => {
  try {
    const effectiveUserId = userId || (await getCurrentUserId());
    if (!effectiveUserId) return null;

    const { data } = await supabase
      .from('interaction')
      .select('interaction_id, interaction_type')
      .eq('user_id', effectiveUserId)
      .eq('deal_id', dealId)
      .in('interaction_type', ['upvote', 'downvote'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      return {
        interactionId: data.interaction_id,
        voteType: data.interaction_type as VoteType,
      };
    }

    return null;
  } catch (error) {
    // No existing vote is not an error
    return null;
  }
};

/**
 * Remove an existing vote interaction
 */
export const removeVote = async (interactionId: string): Promise<MutationResult> => {
  try {
    const { error } = await supabase
      .from('interaction')
      .delete()
      .eq('interaction_id', interactionId);

    if (error) {
      logger.error('[interactions/mutations] Error removing vote:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logger.error('[interactions/mutations] Error removing vote:', error);
    return { success: false, error: 'Failed to remove vote' };
  }
};

/**
 * Add a new vote interaction
 */
export const addVote = async (
  dealId: string,
  voteType: VoteType,
  source: InteractionSource = 'feed'
): Promise<MutationResult> => {
  try {
    const result = await logInteractionEvent({
      dealId,
      interactionType: voteType,
      source,
    });

    return result;
  } catch (error) {
    logger.error('[interactions/mutations] Error adding vote:', error);
    return { success: false, error: 'Failed to add vote' };
  }
};

// ==========================================
// Toggle Mutations
// ==========================================

/**
 * Toggle upvote for a deal
 * - If already upvoted: removes the upvote
 * - If downvoted: removes downvote and adds upvote
 * - If no vote: adds upvote
 */
export const toggleUpvote = async (
  dealId: string,
  source: InteractionSource = 'feed'
): Promise<VoteMutationResult> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const currentVote = await getCurrentVote(dealId, userId);

    if (currentVote) {
      if (currentVote.voteType === 'upvote') {
        // Already upvoted - REMOVE the upvote
        await removeVote(currentVote.interactionId);
        logger.info('🗑️ Upvote removed');
        return {
          success: true,
          newVoteState: {
            isUpvoted: false,
            isDownvoted: false,
            isFavorited: false, // Not tracked here
          },
        };
      } else {
        // Currently downvoted - DELETE downvote, ADD upvote
        await removeVote(currentVote.interactionId);
      }
    }

    // Add new upvote
    const result = await addVote(dealId, 'upvote', source);
    if (result.success) {
      logger.info('✅ Upvote added');
      return {
        success: true,
        newVoteState: {
          isUpvoted: true,
          isDownvoted: false,
          isFavorited: false,
        },
      };
    }

    return { success: false, error: result.error };
  } catch (error) {
    logger.error('[interactions/mutations] Error toggling upvote:', error);
    return { success: false, error: 'Failed to toggle upvote' };
  }
};

/**
 * Toggle downvote for a deal
 * - If already downvoted: removes the downvote
 * - If upvoted: removes upvote and adds downvote
 * - If no vote: adds downvote
 */
export const toggleDownvote = async (
  dealId: string,
  source: InteractionSource = 'feed'
): Promise<VoteMutationResult> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const currentVote = await getCurrentVote(dealId, userId);

    if (currentVote) {
      if (currentVote.voteType === 'downvote') {
        // Already downvoted - REMOVE the downvote
        await removeVote(currentVote.interactionId);
        logger.info('🗑️ Downvote removed');
        return {
          success: true,
          newVoteState: {
            isUpvoted: false,
            isDownvoted: false,
            isFavorited: false,
          },
        };
      } else {
        // Currently upvoted - DELETE upvote, ADD downvote
        await removeVote(currentVote.interactionId);
      }
    }

    // Add new downvote
    const result = await addVote(dealId, 'downvote', source);
    if (result.success) {
      logger.info('✅ Downvote added');
      return {
        success: true,
        newVoteState: {
          isUpvoted: false,
          isDownvoted: true,
          isFavorited: false,
        },
      };
    }

    return { success: false, error: result.error };
  } catch (error) {
    logger.error('[interactions/mutations] Error toggling downvote:', error);
    return { success: false, error: 'Failed to toggle downvote' };
  }
};
