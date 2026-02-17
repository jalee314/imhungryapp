/**
 * Vote Service (Facade)
 *
 * Minimal facade for vote-related operations. This service provides
 * backward compatibility with existing callers while delegating to
 * the canonical implementation in src/features/interactions.
 *
 * For new code, use the interactions feature module directly:
 * @see src/features/interactions for centralized vote selectors and mutations
 *
 * @module services/voteService
 * @since PR-035 - Converted to thin facade delegating to features/interactions
 */

import {
  // Selectors
  selectVoteStates,
  selectVoteCounts,
  // Mutations
  toggleUpvote as canonicalToggleUpvote,
  toggleDownvote as canonicalToggleDownvote,
  toggleDealFavorite,
} from '../features/interactions';
import { clearFavoritesCache } from './favoritesService';

// ==========================================
// Vote State Selectors (Facade)
// ==========================================

/**
 * Get the user's vote states for multiple deals
 * @deprecated Use selectVoteStates from @/features/interactions directly
 */
export const getUserVoteStates = async (
  dealIds: string[]
): Promise<Record<string, { isUpvoted: boolean; isDownvoted: boolean; isFavorited: boolean }>> => {
  return selectVoteStates(dealIds);
};

/**
 * Calculate vote counts for multiple deals
 * @deprecated Use selectVoteCounts from @/features/interactions directly
 */
export const calculateVoteCounts = async (dealIds: string[]): Promise<Record<string, number>> => {
  return selectVoteCounts(dealIds);
};

// ==========================================
// Vote Mutations (Facade)
// ==========================================

/**
 * Toggle upvote for a deal
 * Returns boolean for backward compatibility (true = success)
 * @deprecated Use toggleUpvote from @/features/interactions directly
 */
export const toggleUpvote = async (dealId: string): Promise<boolean> => {
  const result = await canonicalToggleUpvote(dealId);
  return result.success;
};

/**
 * Toggle downvote for a deal
 * Returns boolean for backward compatibility (true = success)
 * @deprecated Use toggleDownvote from @/features/interactions directly
 */
export const toggleDownvote = async (dealId: string): Promise<boolean> => {
  const result = await canonicalToggleDownvote(dealId);
  return result.success;
};

/**
 * Toggle favorite for a deal
 * Returns boolean for backward compatibility (true = success)
 * @deprecated Use toggleDealFavorite from @/features/interactions directly
 */
export const toggleFavorite = async (dealId: string, currentlyFavorited: boolean): Promise<boolean> => {
  console.log('🎯 toggleFavorite called:', { dealId, currentlyFavorited });
  
  const result = await toggleDealFavorite(dealId, currentlyFavorited);
  
  if (result.success) {
    // Clear favorites caches so the favorites screen sees the change immediately
    clearFavoritesCache();
  }
  
  return result.success;
};
