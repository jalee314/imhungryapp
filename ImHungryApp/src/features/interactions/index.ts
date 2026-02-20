/**
 * Interactions Feature Module
 *
 * Centralized domain module for all interaction-related functionality
 * including votes, favorites, and interaction logging.
 *
 * This module provides:
 * - Type definitions for interactions
 * - Selectors for querying vote and favorite states
 * - Mutations for modifying vote and favorite states
 * - Utility functions for interaction logging
 *
 * The existing service APIs (voteService, favoritesService, interactionService)
 * remain as the public facade for backward compatibility. This module provides
 * the underlying implementation that can be used for deduplication and
 * consolidation of interaction logic.
 *
 * @example
 * // Import types
 * import { VoteState, InteractionType } from '@/features/interactions';
 *
 * // Import selectors
 * import { selectVoteStates, selectDealFavoriteState } from '@/features/interactions';
 *
 * // Import mutations
 * import { toggleUpvote, toggleDealFavorite } from '@/features/interactions';
 */

// ==========================================
// Types
// ==========================================
export type {
  InteractionType,
  InteractionSource,
  VoteType,
  VoteState,
  VoteStates,
  VoteCounts,
  FavoriteTargetType,
  FavoriteState,
  FavoriteResult,
  MutationResult,
  VoteMutationResult,
  FavoriteMutationResult,
  InteractionLogParams,
  InteractionLogResult,
  GetVoteStatesParams,
  GetVoteCountsParams,
  GetFavoriteStatusParams,
} from './types';

export {
  isVoteType,
  isInteractionType,
  createDefaultVoteState,
  createDefaultFavoriteState,
} from './types';

// ==========================================
// Selectors
// ==========================================
export {
  // User context
  getCurrentUserId,
  // Vote selectors
  selectVoteStates,
  selectDealVoteState,
  selectVoteCounts,
  selectDealVoteCount,
  selectVoteInfo,
  // Favorite selectors
  selectDealFavoriteState,
  selectDealFavoriteStates,
  selectRestaurantFavoriteState,
  selectRestaurantFavoriteStates,
  selectFavoriteState,
} from './selectors';

// ==========================================
// Mutations
// ==========================================
export {
  // Vote mutations
  getCurrentVote,
  removeVote,
  addVote,
  toggleUpvote,
  toggleDownvote,
  // Favorite mutations
  addDealToFavorites,
  removeDealFromFavorites,
  toggleDealFavorite,
  addRestaurantToFavorites,
  removeRestaurantFromFavorites,
  toggleRestaurantFavorite,
  toggleFavorite,
} from './mutations';

// ==========================================
// Utils
// ==========================================
export {
  logInteractionEvent,
  logClickEvent,
  logShareEvent,
  logClickThroughEvent,
  logFavoriteEvent,
  logRestaurantFavoriteEvent,
  removeFavoriteInteractionsForDeal,
} from './utils';
