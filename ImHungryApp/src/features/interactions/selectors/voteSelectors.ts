/**
 * Interactions Feature - Vote Selectors
 *
 * Centralized selectors for querying vote states and counts.
 * These selectors encapsulate the data fetching logic and can be
 * used by both the service layer and directly by components/hooks.
 */

import { supabase } from '../../../../lib/supabase';
import {
  VoteState,
  VoteStates,
  VoteCounts,
  VoteType,
  createDefaultVoteState,
} from '../types';

// ==========================================
// User Context Helper
// ==========================================

/**
 * Get the current authenticated user's ID
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('[interactions/selectors] Error getting current user:', error);
    return null;
  }
};

// ==========================================
// Vote State Selectors
// ==========================================

/**
 * Get the user's vote states for multiple deals
 * Returns an object mapping deal IDs to their vote states
 */
export const selectVoteStates = async (
  dealIds: string[],
  userId?: string
): Promise<VoteStates> => {
  try {
    const effectiveUserId = userId || (await getCurrentUserId());
    if (!effectiveUserId || dealIds.length === 0) {
      return {};
    }

    // Get the LATEST vote interaction for each deal (one per deal)
    const { data: interactions } = await supabase
      .from('interaction')
      .select('deal_id, interaction_type, interaction_id, created_at')
      .eq('user_id', effectiveUserId)
      .in('deal_id', dealIds)
      .in('interaction_type', ['upvote', 'downvote'])
      .order('created_at', { ascending: false });

    // Fetch favorites
    const { data: favorites } = await supabase
      .from('favorite')
      .select('deal_id')
      .eq('user_id', effectiveUserId)
      .in('deal_id', dealIds);

    // Initialize vote states for all deals
    const voteStates: VoteStates = {};
    dealIds.forEach((dealId) => {
      voteStates[dealId] = createDefaultVoteState();
    });

    // Get the latest interaction for each deal
    const latestInteractions: Record<string, VoteType> = {};
    interactions?.forEach((interaction) => {
      if (!latestInteractions[interaction.deal_id]) {
        latestInteractions[interaction.deal_id] = interaction.interaction_type as VoteType;
      }
    });

    // Apply the latest vote state
    Object.entries(latestInteractions).forEach(([dealId, voteType]) => {
      if (voteType === 'upvote') {
        voteStates[dealId].isUpvoted = true;
      } else if (voteType === 'downvote') {
        voteStates[dealId].isDownvoted = true;
      }
    });

    // Apply favorites
    favorites?.forEach((fav) => {
      if (voteStates[fav.deal_id]) {
        voteStates[fav.deal_id].isFavorited = true;
      }
    });

    return voteStates;
  } catch (error) {
    console.error('[interactions/selectors] Error getting vote states:', error);
    return {};
  }
};

/**
 * Get vote state for a single deal
 */
export const selectDealVoteState = async (
  dealId: string,
  userId?: string
): Promise<VoteState> => {
  const states = await selectVoteStates([dealId], userId);
  return states[dealId] || createDefaultVoteState();
};

// ==========================================
// Vote Count Selectors
// ==========================================

/**
 * Calculate vote counts for multiple deals
 * Returns an object mapping deal IDs to their net vote counts (upvotes - downvotes)
 */
export const selectVoteCounts = async (dealIds: string[]): Promise<VoteCounts> => {
  try {
    if (dealIds.length === 0) return {};

    // Get latest interaction type for each user-deal combination
    const { data: interactions } = await supabase
      .from('interaction')
      .select('deal_id, user_id, interaction_type, created_at')
      .in('deal_id', dealIds)
      .in('interaction_type', ['upvote', 'downvote'])
      .order('created_at', { ascending: false });

    const voteCounts: VoteCounts = {};

    // Initialize all deals to 0
    dealIds.forEach((dealId) => {
      voteCounts[dealId] = 0;
    });

    // Group interactions by deal and user, keep only latest
    const latestUserVotes: Record<string, Record<string, VoteType>> = {};

    interactions?.forEach((interaction) => {
      const dealId = interaction.deal_id;
      const interactionUserId = interaction.user_id;

      if (!latestUserVotes[dealId]) {
        latestUserVotes[dealId] = {};
      }

      // Only keep the first (latest) interaction per user per deal
      if (!latestUserVotes[dealId][interactionUserId]) {
        latestUserVotes[dealId][interactionUserId] = interaction.interaction_type as VoteType;
      }
    });

    // Calculate vote counts
    Object.entries(latestUserVotes).forEach(([dealId, userVotes]) => {
      let count = 0;
      Object.values(userVotes).forEach((voteType) => {
        if (voteType === 'upvote') count++;
        else if (voteType === 'downvote') count--;
      });
      voteCounts[dealId] = count;
    });

    return voteCounts;
  } catch (error) {
    console.error('[interactions/selectors] Error calculating vote counts:', error);
    return {};
  }
};

/**
 * Get vote count for a single deal
 */
export const selectDealVoteCount = async (dealId: string): Promise<number> => {
  const counts = await selectVoteCounts([dealId]);
  return counts[dealId] || 0;
};

// ==========================================
// Combined Selectors
// ==========================================

/**
 * Get both vote states and counts for multiple deals in parallel
 * Useful for enriching deal data with full vote information
 */
export const selectVoteInfo = async (
  dealIds: string[],
  userId?: string
): Promise<{
  states: VoteStates;
  counts: VoteCounts;
}> => {
  const [states, counts] = await Promise.all([
    selectVoteStates(dealIds, userId),
    selectVoteCounts(dealIds),
  ]);

  return { states, counts };
};
