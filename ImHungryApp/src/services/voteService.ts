import { supabase } from '../../lib/supabase';
import { logInteraction } from './interactionService';

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
 * Get the user's vote states for multiple deals
 */
export const getUserVoteStates = async (
  dealIds: string[]
): Promise<Record<string, { isUpvoted: boolean; isDownvoted: boolean; isFavorited: boolean }>> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId || dealIds.length === 0) return {};

    // Get the LATEST vote interaction for each deal (one per deal)
    const { data: interactions } = await supabase
      .from('interaction')
      .select('deal_id, interaction_type, interaction_id, created_at')
      .eq('user_id', userId)
      .in('deal_id', dealIds)
      .in('interaction_type', ['upvote', 'downvote'])
      .order('created_at', { ascending: false });

    // Fetch favorites
    const { data: favorites } = await supabase
      .from('favorite')
      .select('deal_id')
      .eq('user_id', userId)
      .in('deal_id', dealIds);

    const voteStates: Record<string, { isUpvoted: boolean; isDownvoted: boolean; isFavorited: boolean }> = {};
    
    dealIds.forEach(dealId => {
      voteStates[dealId] = { isUpvoted: false, isDownvoted: false, isFavorited: false };
    });

    // Get the latest interaction for each deal
    const latestInteractions: Record<string, string> = {};
    interactions?.forEach(interaction => {
      if (!latestInteractions[interaction.deal_id]) {
        latestInteractions[interaction.deal_id] = interaction.interaction_type;
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
    favorites?.forEach(fav => {
      if (voteStates[fav.deal_id]) {
        voteStates[fav.deal_id].isFavorited = true;
      }
    });

    return voteStates;
  } catch (error) {
    console.error('Error getting vote states:', error);
    return {};
  }
};

/**
 * Calculate vote counts for multiple deals
 */
export const calculateVoteCounts = async (dealIds: string[]): Promise<Record<string, number>> => {
  try {
    if (dealIds.length === 0) return {};

    // Get latest interaction type for each user-deal combination
    const { data: interactions } = await supabase
      .from('interaction')
      .select('deal_id, user_id, interaction_type, created_at')
      .in('deal_id', dealIds)
      .in('interaction_type', ['upvote', 'downvote'])
      .order('created_at', { ascending: false });

    const voteCounts: Record<string, number> = {};
    
    // Initialize all deals to 0
    dealIds.forEach(dealId => {
      voteCounts[dealId] = 0;
    });

    // Group interactions by deal and user, keep only latest
    const latestUserVotes: Record<string, Record<string, 'upvote' | 'downvote'>> = {};
    
    interactions?.forEach(interaction => {
      const dealId = interaction.deal_id;
      const userId = interaction.user_id;
      
      if (!latestUserVotes[dealId]) {
        latestUserVotes[dealId] = {};
      }
      
      // Only keep the first (latest) interaction per user per deal
      if (!latestUserVotes[dealId][userId]) {
        latestUserVotes[dealId][userId] = interaction.interaction_type;
      }
    });

    // Calculate vote counts
    Object.entries(latestUserVotes).forEach(([dealId, userVotes]) => {
      let count = 0;
      Object.values(userVotes).forEach(voteType => {
        if (voteType === 'upvote') count++;
        else if (voteType === 'downvote') count--;
      });
      voteCounts[dealId] = count;
    });

    return voteCounts;
  } catch (error) {
    console.error('Error calculating vote counts:', error);
    return {};
  }
};

/**
 * Toggle upvote - DELETE old vote, add new if toggling on
 */
export const toggleUpvote = async (dealId: string): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    // Get current vote state
    const { data: existingVotes } = await supabase
      .from('interaction')
      .select('interaction_id, interaction_type')
      .eq('user_id', userId)
      .eq('deal_id', dealId)
      .in('interaction_type', ['upvote', 'downvote'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingVotes) {
      if (existingVotes.interaction_type === 'upvote') {
        // Already upvoted - REMOVE the upvote
        await supabase
          .from('interaction')
          .delete()
          .eq('interaction_id', existingVotes.interaction_id);
        
        console.log('🗑️ Upvote removed');
        return true;
      } else {
        // Currently downvoted - DELETE downvote, ADD upvote
        await supabase
          .from('interaction')
          .delete()
          .eq('interaction_id', existingVotes.interaction_id);
      }
    }

    // Add new upvote
    await logInteraction(dealId, 'upvote');
    console.log('✅ Upvote added');
    return true;
  } catch (error) {
    console.error('Error toggling upvote:', error);
    return false;
  }
};

/**
 * Toggle downvote - DELETE old vote, add new if toggling on
 */
export const toggleDownvote = async (dealId: string): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    // Get current vote state
    const { data: existingVotes } = await supabase
      .from('interaction')
      .select('interaction_id, interaction_type')
      .eq('user_id', userId)
      .eq('deal_id', dealId)
      .in('interaction_type', ['upvote', 'downvote'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingVotes) {
      if (existingVotes.interaction_type === 'downvote') {
        // Already downvoted - REMOVE the downvote
        await supabase
          .from('interaction')
          .delete()
          .eq('interaction_id', existingVotes.interaction_id);
        
        console.log('🗑️ Downvote removed');
        return true;
      } else {
        // Currently upvoted - DELETE upvote, ADD downvote
        await supabase
          .from('interaction')
          .delete()
          .eq('interaction_id', existingVotes.interaction_id);
      }
    }

    // Add new downvote
    await logInteraction(dealId, 'downvote');
    console.log('✅ Downvote added');
    return true;
  } catch (error) {
    console.error('Error toggling downvote:', error);
    return false;
  }
};

/**
 * Toggle favorite - DELETE if exists, INSERT if not
 */
export const toggleFavorite = async (dealId: string, currentlyFavorited: boolean): Promise<boolean> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    if (currentlyFavorited) {
      // REMOVE from favorites table
      const { error } = await supabase
        .from('favorite')
        .delete()
        .eq('user_id', userId)
        .eq('deal_id', dealId);

      if (error) {
        console.error('Error removing favorite:', error);
        return false;
      }
      
      console.log('🗑️ Favorite removed');
    } else {
      // ADD to favorites table
      const { error } = await supabase
        .from('favorite')
        .insert({
          user_id: userId,
          deal_id: dealId,
        });

      if (error) {
        console.error('Error adding favorite:', error);
        return false;
      }

      // Also log the interaction
      await logInteraction(dealId, 'favorite');
      console.log('✅ Favorite added');
    }

    return true;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }
};
