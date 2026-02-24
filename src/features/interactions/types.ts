/**
 * Interactions Feature - Type Definitions
 *
 * Centralized types for all interaction-related functionality including
 * votes, favorites, and interaction logging.
 */

// ==========================================
// Interaction Types (matching database enum)
// ==========================================

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

export type InteractionSource =
  | 'feed'
  | 'search'
  | 'favorites'
  | 'profile'
  | 'discover';

// ==========================================
// Vote Types
// ==========================================

export type VoteType = 'upvote' | 'downvote';

export interface VoteState {
  isUpvoted: boolean;
  isDownvoted: boolean;
  isFavorited: boolean;
}

export interface VoteStates {
  [dealId: string]: VoteState;
}

export interface VoteCounts {
  [dealId: string]: number;
}

// ==========================================
// Favorite Types
// ==========================================

export type FavoriteTargetType = 'deal' | 'restaurant';

export interface FavoriteState {
  isFavorited: boolean;
  favoritedAt?: string; // ISO timestamp
}

export interface FavoriteResult {
  success: boolean;
  isFavorited?: boolean;
  error?: string;
}

// ==========================================
// Mutation Result Types
// ==========================================

export interface MutationResult {
  success: boolean;
  error?: string;
}

export interface VoteMutationResult extends MutationResult {
  newVoteState?: VoteState;
}

export interface FavoriteMutationResult extends MutationResult {
  isFavorited?: boolean;
}

// ==========================================
// Interaction Logging Types
// ==========================================

export interface InteractionLogParams {
  dealId?: string;
  restaurantId?: string;
  interactionType: InteractionType;
  source?: InteractionSource;
  positionInFeed?: number;
  dwellTime?: number;
}

export interface InteractionLogResult {
  success: boolean;
  error?: string;
}

// ==========================================
// Selector Input Types
// ==========================================

export interface GetVoteStatesParams {
  dealIds: string[];
  userId?: string;
}

export interface GetVoteCountsParams {
  dealIds: string[];
}

export interface GetFavoriteStatusParams {
  targetId: string;
  targetType: FavoriteTargetType;
  userId?: string;
}

// ==========================================
// Helper Type Guards
// ==========================================

export const isVoteType = (type: string): type is VoteType => {
  return type === 'upvote' || type === 'downvote';
};

export const isInteractionType = (type: string): type is InteractionType => {
  const validTypes: InteractionType[] = [
    'impression',
    'click-open',
    'click-through',
    'upvote',
    'downvote',
    'save',
    'favorite',
    'redemption_proxy',
    'report',
    'block',
    'share',
  ];
  return validTypes.includes(type as InteractionType);
};

// ==========================================
// Default Values
// ==========================================

export const createDefaultVoteState = (): VoteState => ({
  isUpvoted: false,
  isDownvoted: false,
  isFavorited: false,
});

export const createDefaultFavoriteState = (): FavoriteState => ({
  isFavorited: false,
});
