/**
 * Interactions Feature - Vote Selectors
 *
 * Centralized selectors for querying vote states and counts.
 * These selectors encapsulate the data fetching logic and can be
 * used by both the service layer and directly by components/hooks.
 */

import { supabase } from '../../../../lib/supabase';
import { getCurrentUserId as getCurrentUserIdFromService } from '../../../services/currentUserService';
import {
  VoteState,
  VoteStates,
  VoteCounts,
  VoteType,
  createDefaultVoteState,
} from '../types';

interface LatestVoteStateRow {
  deal_id: string;
  latest_vote: VoteType | null;
  is_favorited: boolean | null;
}

interface NetVoteCountRow {
  deal_id: string;
  net_votes: number | string | null;
}

const isRpcUnavailableError = (error: unknown): boolean => {
  const maybeError = error as { code?: string; message?: string } | null;
  const code = maybeError?.code ?? '';
  const message = (maybeError?.message ?? '').toLowerCase();

  return (
    code === '42883' ||
    code === 'PGRST202' ||
    message.includes('could not find the function') ||
    message.includes('does not exist')
  );
};

const dedupeDealIds = (dealIds: string[]): string[] =>
  Array.from(new Set(dealIds.filter(Boolean)));

// ==========================================
// User Context Helper
// ==========================================

/**
 * Get the current authenticated user's ID
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  return getCurrentUserIdFromService();
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
    const uniqueDealIds = dedupeDealIds(dealIds);

    if (!effectiveUserId || uniqueDealIds.length === 0) {
      return {};
    }

    const voteStates: VoteStates = {};
    uniqueDealIds.forEach((dealId) => {
      voteStates[dealId] = createDefaultVoteState();
    });

    const { data, error } = await supabase.rpc('get_latest_vote_states_for_deals', {
      p_user_id: effectiveUserId,
      p_deal_ids: uniqueDealIds,
    });

    if (error) {
      if (!isRpcUnavailableError(error)) {
        console.error('[interactions/selectors] Error getting vote states via RPC:', error);
      }
      return selectVoteStatesLegacy(uniqueDealIds, effectiveUserId);
    }

    (data as LatestVoteStateRow[] | null | undefined)?.forEach((row) => {
      const dealState = voteStates[row.deal_id];
      if (!dealState) return;

      if (row.latest_vote === 'upvote') {
        dealState.isUpvoted = true;
      } else if (row.latest_vote === 'downvote') {
        dealState.isDownvoted = true;
      }

      dealState.isFavorited = Boolean(row.is_favorited);
    });

    return voteStates;
  } catch (error) {
    console.error('[interactions/selectors] Error getting vote states:', error);
    const effectiveUserId = userId || (await getCurrentUserId());
    if (!effectiveUserId) {
      return {};
    }
    return selectVoteStatesLegacy(dedupeDealIds(dealIds), effectiveUserId);
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
    const uniqueDealIds = dedupeDealIds(dealIds);
    if (uniqueDealIds.length === 0) return {};

    const voteCounts: VoteCounts = {};

    // Initialize all deals to 0
    uniqueDealIds.forEach((dealId) => {
      voteCounts[dealId] = 0;
    });

    const { data, error } = await supabase.rpc('get_net_vote_counts_for_deals', {
      p_deal_ids: uniqueDealIds,
    });

    if (error) {
      if (!isRpcUnavailableError(error)) {
        console.error('[interactions/selectors] Error calculating vote counts via RPC:', error);
      }
      return selectVoteCountsLegacy(uniqueDealIds);
    }

    (data as NetVoteCountRow[] | null | undefined)?.forEach((row) => {
      if (!row.deal_id) return;
      voteCounts[row.deal_id] = Number(row.net_votes ?? 0);
    });

    return voteCounts;
  } catch (error) {
    console.error('[interactions/selectors] Error calculating vote counts:', error);
    return selectVoteCountsLegacy(dedupeDealIds(dealIds));
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

const selectVoteStatesLegacy = async (
  dealIds: string[],
  effectiveUserId: string
): Promise<VoteStates> => {
  const voteStates: VoteStates = {};
  dealIds.forEach((dealId) => {
    voteStates[dealId] = createDefaultVoteState();
  });

  if (dealIds.length === 0) {
    return voteStates;
  }

  const [interactionsResult, favoritesResult] = await Promise.all([
    supabase
      .from('interaction')
      .select('deal_id, interaction_type, interaction_id, created_at')
      .eq('user_id', effectiveUserId)
      .in('deal_id', dealIds)
      .in('interaction_type', ['upvote', 'downvote'])
      .order('created_at', { ascending: false }),
    supabase
      .from('favorite')
      .select('deal_id')
      .eq('user_id', effectiveUserId)
      .in('deal_id', dealIds),
  ]);

  if (interactionsResult.error) {
    console.error('[interactions/selectors] Error getting vote states (legacy interactions):', interactionsResult.error);
    return voteStates;
  }

  if (favoritesResult.error) {
    console.error('[interactions/selectors] Error getting vote states (legacy favorites):', favoritesResult.error);
    return voteStates;
  }

  const latestInteractions: Record<string, VoteType> = {};
  interactionsResult.data?.forEach((interaction) => {
    if (!latestInteractions[interaction.deal_id]) {
      latestInteractions[interaction.deal_id] = interaction.interaction_type as VoteType;
    }
  });

  Object.entries(latestInteractions).forEach(([dealId, voteType]) => {
    if (voteType === 'upvote') {
      voteStates[dealId].isUpvoted = true;
    } else if (voteType === 'downvote') {
      voteStates[dealId].isDownvoted = true;
    }
  });

  favoritesResult.data?.forEach((favorite) => {
    if (favorite.deal_id && voteStates[favorite.deal_id]) {
      voteStates[favorite.deal_id].isFavorited = true;
    }
  });

  return voteStates;
};

const selectVoteCountsLegacy = async (dealIds: string[]): Promise<VoteCounts> => {
  const voteCounts: VoteCounts = {};
  dealIds.forEach((dealId) => {
    voteCounts[dealId] = 0;
  });

  if (dealIds.length === 0) {
    return voteCounts;
  }

  const { data: interactions, error } = await supabase
    .from('interaction')
    .select('deal_id, user_id, interaction_type, created_at')
    .in('deal_id', dealIds)
    .in('interaction_type', ['upvote', 'downvote'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[interactions/selectors] Error calculating vote counts (legacy):', error);
    return voteCounts;
  }

  const latestUserVotes: Record<string, Record<string, VoteType>> = {};
  interactions?.forEach((interaction) => {
    const dealId = interaction.deal_id;
    const interactionUserId = interaction.user_id;
    if (!latestUserVotes[dealId]) {
      latestUserVotes[dealId] = {};
    }
    if (!latestUserVotes[dealId][interactionUserId]) {
      latestUserVotes[dealId][interactionUserId] = interaction.interaction_type as VoteType;
    }
  });

  Object.entries(latestUserVotes).forEach(([dealId, userVotes]) => {
    let count = 0;
    Object.values(userVotes).forEach((voteType) => {
      if (voteType === 'upvote') count += 1;
      else if (voteType === 'downvote') count -= 1;
    });
    voteCounts[dealId] = count;
  });

  return voteCounts;
};
