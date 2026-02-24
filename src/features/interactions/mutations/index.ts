/**
 * Interactions Feature - Mutations Index
 *
 * Re-exports all mutation functions for convenient access.
 */

// Vote mutations
export {
  getCurrentVote,
  removeVote,
  addVote,
  toggleUpvote,
  toggleDownvote,
} from './voteMutations';

// Favorite mutations
export {
  addDealToFavorites,
  removeDealFromFavorites,
  toggleDealFavorite,
  addRestaurantToFavorites,
  removeRestaurantFromFavorites,
  toggleRestaurantFavorite,
  toggleFavorite,
} from './favoriteMutations';
