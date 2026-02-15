/**
 * Tests for interactions feature module
 *
 * These tests verify that the interactions feature module exports
 * correctly and provides the expected types and utilities.
 */

import {
  // Types
  isVoteType,
  isInteractionType,
  createDefaultVoteState,
  createDefaultFavoriteState,
  // Selectors
  selectVoteStates,
  selectDealVoteState,
  selectVoteCounts,
  selectDealVoteCount,
  selectVoteInfo,
  selectDealFavoriteState,
  selectDealFavoriteStates,
  selectRestaurantFavoriteState,
  selectRestaurantFavoriteStates,
  selectFavoriteState,
  getCurrentUserId,
  // Mutations
  getCurrentVote,
  removeVote,
  addVote,
  toggleUpvote,
  toggleDownvote,
  addDealToFavorites,
  removeDealFromFavorites,
  toggleDealFavorite,
  addRestaurantToFavorites,
  removeRestaurantFromFavorites,
  toggleRestaurantFavorite,
  toggleFavorite,
  // Utils
  logInteractionEvent,
  logClickEvent,
  logShareEvent,
  logClickThroughEvent,
  logFavoriteEvent,
  logRestaurantFavoriteEvent,
  removeFavoriteInteractionsForDeal,
  // All exports should be available
  VoteState,
  VoteStates,
  VoteCounts,
  FavoriteTargetType,
  FavoriteState,
  InteractionType,
  InteractionSource,
} from '../index';

describe('interactions feature module', () => {
  describe('type guards', () => {
    describe('isVoteType', () => {
      it('should return true for upvote', () => {
        expect(isVoteType('upvote')).toBe(true);
      });

      it('should return true for downvote', () => {
        expect(isVoteType('downvote')).toBe(true);
      });

      it('should return false for other interaction types', () => {
        expect(isVoteType('favorite')).toBe(false);
        expect(isVoteType('click-open')).toBe(false);
        expect(isVoteType('impression')).toBe(false);
      });

      it('should return false for invalid strings', () => {
        expect(isVoteType('invalid')).toBe(false);
        expect(isVoteType('')).toBe(false);
      });
    });

    describe('isInteractionType', () => {
      it('should return true for all valid interaction types', () => {
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

        validTypes.forEach((type) => {
          expect(isInteractionType(type)).toBe(true);
        });
      });

      it('should return false for invalid strings', () => {
        expect(isInteractionType('invalid')).toBe(false);
        expect(isInteractionType('')).toBe(false);
        expect(isInteractionType('like')).toBe(false);
      });
    });
  });

  describe('default value creators', () => {
    describe('createDefaultVoteState', () => {
      it('should create a vote state with all false values', () => {
        const state = createDefaultVoteState();

        expect(state).toEqual({
          isUpvoted: false,
          isDownvoted: false,
          isFavorited: false,
        });
      });

      it('should return a new object each time', () => {
        const state1 = createDefaultVoteState();
        const state2 = createDefaultVoteState();

        expect(state1).not.toBe(state2);
        expect(state1).toEqual(state2);
      });
    });

    describe('createDefaultFavoriteState', () => {
      it('should create a favorite state with isFavorited false', () => {
        const state = createDefaultFavoriteState();

        expect(state).toEqual({
          isFavorited: false,
        });
      });

      it('should return a new object each time', () => {
        const state1 = createDefaultFavoriteState();
        const state2 = createDefaultFavoriteState();

        expect(state1).not.toBe(state2);
        expect(state1).toEqual(state2);
      });
    });
  });

  describe('module exports', () => {
    it('should export vote types', () => {
      // Type assertion to ensure types are exported
      const voteState: VoteState = createDefaultVoteState();
      expect(voteState).toBeDefined();

      const voteStates: VoteStates = { 'deal-1': voteState };
      expect(voteStates).toBeDefined();

      const voteCounts: VoteCounts = { 'deal-1': 5 };
      expect(voteCounts).toBeDefined();
    });

    it('should export favorite types', () => {
      const favoriteState: FavoriteState = createDefaultFavoriteState();
      expect(favoriteState).toBeDefined();

      const targetType: FavoriteTargetType = 'deal';
      expect(targetType).toBeDefined();
    });

    it('should export interaction types', () => {
      const interactionType: InteractionType = 'click-open';
      expect(interactionType).toBeDefined();

      const source: InteractionSource = 'feed';
      expect(source).toBeDefined();
    });
  });
});

describe('interactions feature selectors', () => {
  // Note: Full selector tests require mocking supabase
  // These tests verify the module structure is correct
  
  it('should export selector functions', () => {
    // Verify all selectors are exported as functions
    expect(typeof selectVoteStates).toBe('function');
    expect(typeof selectDealVoteState).toBe('function');
    expect(typeof selectVoteCounts).toBe('function');
    expect(typeof selectDealVoteCount).toBe('function');
    expect(typeof selectVoteInfo).toBe('function');
    expect(typeof selectDealFavoriteState).toBe('function');
    expect(typeof selectDealFavoriteStates).toBe('function');
    expect(typeof selectRestaurantFavoriteState).toBe('function');
    expect(typeof selectRestaurantFavoriteStates).toBe('function');
    expect(typeof selectFavoriteState).toBe('function');
    expect(typeof getCurrentUserId).toBe('function');
  });
});

describe('interactions feature mutations', () => {
  // Note: Full mutation tests require mocking supabase
  // These tests verify the module structure is correct

  it('should export mutation functions', () => {
    // Verify all mutations are exported as functions
    expect(typeof getCurrentVote).toBe('function');
    expect(typeof removeVote).toBe('function');
    expect(typeof addVote).toBe('function');
    expect(typeof toggleUpvote).toBe('function');
    expect(typeof toggleDownvote).toBe('function');
    expect(typeof addDealToFavorites).toBe('function');
    expect(typeof removeDealFromFavorites).toBe('function');
    expect(typeof toggleDealFavorite).toBe('function');
    expect(typeof addRestaurantToFavorites).toBe('function');
    expect(typeof removeRestaurantFromFavorites).toBe('function');
    expect(typeof toggleRestaurantFavorite).toBe('function');
    expect(typeof toggleFavorite).toBe('function');
  });
});

describe('interactions feature utils', () => {
  // Note: Full util tests require mocking supabase
  // These tests verify the module structure is correct

  it('should export utility functions', () => {
    // Verify all utils are exported as functions
    expect(typeof logInteractionEvent).toBe('function');
    expect(typeof logClickEvent).toBe('function');
    expect(typeof logShareEvent).toBe('function');
    expect(typeof logClickThroughEvent).toBe('function');
    expect(typeof logFavoriteEvent).toBe('function');
    expect(typeof logRestaurantFavoriteEvent).toBe('function');
    expect(typeof removeFavoriteInteractionsForDeal).toBe('function');
  });
});
