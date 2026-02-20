/**
 * Interactions Feature - Selectors Index
 *
 * Re-exports all selector functions for convenient access.
 */

// Vote selectors
export {
  getCurrentUserId,
  selectVoteStates,
  selectDealVoteState,
  selectVoteCounts,
  selectDealVoteCount,
  selectVoteInfo,
} from './voteSelectors';

// Favorite selectors
export {
  selectDealFavoriteState,
  selectDealFavoriteStates,
  selectRestaurantFavoriteState,
  selectRestaurantFavoriteStates,
  selectFavoriteState,
} from './favoriteSelectors';
