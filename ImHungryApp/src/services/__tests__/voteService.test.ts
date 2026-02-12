/**
 * Characterization Tests for voteService
 *
 * These tests capture the exact behavior of the voteService as a regression guard.
 * They document toggle-on, toggle-off, and opposite-vote replacement semantics.
 *
 * Behaviors captured:
 * - toggleUpvote: Toggle on/off upvote, switch from downvote to upvote
 * - toggleDownvote: Toggle on/off downvote, switch from upvote to downvote
 * - toggleFavorite: Add/remove favorites, clears cache
 * - getUserVoteStates: Fetch vote states for multiple deals
 * - calculateVoteCounts: Calculate net vote counts across users
 */

import {
  mockSupabase,
  configureMockAuth,
  mockUser,
} from '../../test-utils/mocks/supabaseMock';
import {
  toggleUpvote,
  toggleDownvote,
  toggleFavorite,
  getUserVoteStates,
  calculateVoteCounts,
} from '../voteService';

// Mock the interactionService
jest.mock('../interactionService', () => ({
  logInteraction: jest.fn().mockResolvedValue(true),
  removeFavoriteInteractions: jest.fn().mockResolvedValue(true),
}));

// Mock the favoritesService clearFavoritesCache
const mockClearFavoritesCache = jest.fn();
jest.mock('../favoritesService', () => ({
  clearFavoritesCache: () => mockClearFavoritesCache(),
}));

import { logInteraction, removeFavoriteInteractions } from '../interactionService';

describe('voteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to authenticated user
    configureMockAuth(mockUser);
  });

  describe('toggleUpvote', () => {
    describe('when user is not authenticated', () => {
      it('should return false', async () => {
        // Configure no user
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await toggleUpvote('deal-123');

        expect(result).toBe(false);
      });
    });

    describe('when no existing vote exists', () => {
      it('should add an upvote and return true', async () => {
        // Mock: no existing vote found (single returns PGRST116 error for no rows)
        const mockQueryBuilder = createChainableMock();
        mockQueryBuilder.single.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // No rows found
        });
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await toggleUpvote('deal-123');

        expect(result).toBe(true);
        expect(logInteraction).toHaveBeenCalledWith('deal-123', 'upvote');
      });
    });

    describe('when already upvoted (toggle off)', () => {
      it('should remove the upvote and return true', async () => {
        // Mock: existing upvote found
        const mockQueryBuilder = createChainableMock();
        mockQueryBuilder.single.mockResolvedValue({
          data: {
            interaction_id: 'interaction-123',
            interaction_type: 'upvote',
          },
          error: null,
        });
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await toggleUpvote('deal-123');

        expect(result).toBe(true);
        // Should have called delete on the interaction
        expect(mockQueryBuilder.delete).toHaveBeenCalled();
        // Should NOT have logged a new interaction (toggle off just removes)
        expect(logInteraction).not.toHaveBeenCalled();
      });
    });

    describe('when currently downvoted (opposite vote replacement)', () => {
      it('should delete downvote and add upvote', async () => {
        // Mock: existing downvote found
        const mockQueryBuilder = createChainableMock();
        mockQueryBuilder.single.mockResolvedValue({
          data: {
            interaction_id: 'interaction-456',
            interaction_type: 'downvote',
          },
          error: null,
        });
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await toggleUpvote('deal-123');

        expect(result).toBe(true);
        // Should delete the existing downvote
        expect(mockQueryBuilder.delete).toHaveBeenCalled();
        // Should add a new upvote
        expect(logInteraction).toHaveBeenCalledWith('deal-123', 'upvote');
      });
    });

    describe('on error', () => {
      it('should return false when database throws', async () => {
        mockSupabase.from.mockImplementation(() => {
          throw new Error('Database error');
        });

        const result = await toggleUpvote('deal-123');

        expect(result).toBe(false);
      });
    });
  });

  describe('toggleDownvote', () => {
    describe('when user is not authenticated', () => {
      it('should return false', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await toggleDownvote('deal-123');

        expect(result).toBe(false);
      });
    });

    describe('when no existing vote exists', () => {
      it('should add a downvote and return true', async () => {
        const mockQueryBuilder = createChainableMock();
        mockQueryBuilder.single.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        });
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await toggleDownvote('deal-123');

        expect(result).toBe(true);
        expect(logInteraction).toHaveBeenCalledWith('deal-123', 'downvote');
      });
    });

    describe('when already downvoted (toggle off)', () => {
      it('should remove the downvote and return true', async () => {
        const mockQueryBuilder = createChainableMock();
        mockQueryBuilder.single.mockResolvedValue({
          data: {
            interaction_id: 'interaction-789',
            interaction_type: 'downvote',
          },
          error: null,
        });
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await toggleDownvote('deal-123');

        expect(result).toBe(true);
        expect(mockQueryBuilder.delete).toHaveBeenCalled();
        expect(logInteraction).not.toHaveBeenCalled();
      });
    });

    describe('when currently upvoted (opposite vote replacement)', () => {
      it('should delete upvote and add downvote', async () => {
        const mockQueryBuilder = createChainableMock();
        mockQueryBuilder.single.mockResolvedValue({
          data: {
            interaction_id: 'interaction-101',
            interaction_type: 'upvote',
          },
          error: null,
        });
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await toggleDownvote('deal-123');

        expect(result).toBe(true);
        expect(mockQueryBuilder.delete).toHaveBeenCalled();
        expect(logInteraction).toHaveBeenCalledWith('deal-123', 'downvote');
      });
    });

    describe('on error', () => {
      it('should return false when database throws', async () => {
        mockSupabase.from.mockImplementation(() => {
          throw new Error('Database error');
        });

        const result = await toggleDownvote('deal-123');

        expect(result).toBe(false);
      });
    });
  });

  describe('toggleFavorite', () => {
    describe('when user is not authenticated', () => {
      it('should return false', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await toggleFavorite('deal-123', false);

        expect(result).toBe(false);
      });
    });

    describe('when adding a favorite (currentlyFavorited = false)', () => {
      it('should insert into favorites table and log interaction', async () => {
        const mockQueryBuilder = createChainableMock();
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await toggleFavorite('deal-123', false);

        expect(result).toBe(true);
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
          user_id: mockUser.id,
          deal_id: 'deal-123',
        });
        expect(logInteraction).toHaveBeenCalledWith('deal-123', 'favorite');
        expect(mockClearFavoritesCache).toHaveBeenCalled();
      });
    });

    describe('when removing a favorite (currentlyFavorited = true)', () => {
      it('should delete from favorites table and remove interactions', async () => {
        const mockQueryBuilder = createChainableMock();
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await toggleFavorite('deal-123', true);

        expect(result).toBe(true);
        expect(mockQueryBuilder.delete).toHaveBeenCalled();
        expect(removeFavoriteInteractions).toHaveBeenCalledWith('deal-123');
        expect(mockClearFavoritesCache).toHaveBeenCalled();
      });
    });

    describe('when insert fails with error', () => {
      it('should return false', async () => {
        const mockQueryBuilder = createChainableMock();
        // Make the insert return an error by overriding the then handler
        Object.defineProperty(mockQueryBuilder, 'then', {
          value: (resolve: (value: unknown) => void) =>
            Promise.resolve({ data: null, error: { message: 'Insert failed' } }).then(resolve),
        });
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await toggleFavorite('deal-123', false);

        expect(result).toBe(false);
      });
    });

    describe('when delete fails with error', () => {
      it('should return false', async () => {
        const mockQueryBuilder = createChainableMock();
        // Make the delete path return an error
        Object.defineProperty(mockQueryBuilder, 'then', {
          value: (resolve: (value: unknown) => void) =>
            Promise.resolve({ data: null, error: { message: 'Delete failed' } }).then(resolve),
        });
        mockSupabase.from.mockReturnValue(mockQueryBuilder);

        const result = await toggleFavorite('deal-123', true);

        expect(result).toBe(false);
      });
    });

    describe('on exception', () => {
      it('should return false when database throws', async () => {
        mockSupabase.from.mockImplementation(() => {
          throw new Error('Database error');
        });

        const result = await toggleFavorite('deal-123', false);

        expect(result).toBe(false);
      });
    });
  });

  describe('getUserVoteStates', () => {
    describe('when user is not authenticated', () => {
      it('should return empty object', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const result = await getUserVoteStates(['deal-1', 'deal-2']);

        expect(result).toEqual({});
      });
    });

    describe('when dealIds array is empty', () => {
      it('should return empty object', async () => {
        const result = await getUserVoteStates([]);

        expect(result).toEqual({});
      });
    });

    describe('with valid deals and votes', () => {
      it('should return correct vote states for each deal', async () => {
        // Set up mock to return different data for different table queries
        let callCount = 0;
        mockSupabase.from.mockImplementation((table: string) => {
          const mockBuilder = createChainableMock();
          
          if (table === 'interaction') {
            // Return upvote for deal-1, downvote for deal-2
            Object.defineProperty(mockBuilder, 'then', {
              value: (resolve: (value: unknown) => void) =>
                Promise.resolve({
                  data: [
                    { deal_id: 'deal-1', interaction_type: 'upvote', interaction_id: 'int-1', created_at: '2026-01-02' },
                    { deal_id: 'deal-2', interaction_type: 'downvote', interaction_id: 'int-2', created_at: '2026-01-02' },
                  ],
                  error: null,
                }).then(resolve),
            });
          } else if (table === 'favorite') {
            // Return deal-1 as favorited
            Object.defineProperty(mockBuilder, 'then', {
              value: (resolve: (value: unknown) => void) =>
                Promise.resolve({
                  data: [{ deal_id: 'deal-1' }],
                  error: null,
                }).then(resolve),
            });
          }
          
          return mockBuilder;
        });

        const result = await getUserVoteStates(['deal-1', 'deal-2', 'deal-3']);

        // deal-1: upvoted + favorited
        expect(result['deal-1']).toEqual({
          isUpvoted: true,
          isDownvoted: false,
          isFavorited: true,
        });

        // deal-2: downvoted, not favorited
        expect(result['deal-2']).toEqual({
          isUpvoted: false,
          isDownvoted: true,
          isFavorited: false,
        });

        // deal-3: no votes, no favorite
        expect(result['deal-3']).toEqual({
          isUpvoted: false,
          isDownvoted: false,
          isFavorited: false,
        });
      });

      it('should use latest vote when multiple interactions exist', async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          const mockBuilder = createChainableMock();
          
          if (table === 'interaction') {
            // Return interactions ordered by created_at desc - latest first
            Object.defineProperty(mockBuilder, 'then', {
              value: (resolve: (value: unknown) => void) =>
                Promise.resolve({
                  data: [
                    // Latest: upvote (should be used)
                    { deal_id: 'deal-1', interaction_type: 'upvote', interaction_id: 'int-2', created_at: '2026-01-02' },
                    // Older: downvote (should be ignored)
                    { deal_id: 'deal-1', interaction_type: 'downvote', interaction_id: 'int-1', created_at: '2026-01-01' },
                  ],
                  error: null,
                }).then(resolve),
            });
          } else if (table === 'favorite') {
            Object.defineProperty(mockBuilder, 'then', {
              value: (resolve: (value: unknown) => void) =>
                Promise.resolve({ data: [], error: null }).then(resolve),
            });
          }
          
          return mockBuilder;
        });

        const result = await getUserVoteStates(['deal-1']);

        // Should use latest (upvote), not older (downvote)
        expect(result['deal-1'].isUpvoted).toBe(true);
        expect(result['deal-1'].isDownvoted).toBe(false);
      });
    });

    describe('on error', () => {
      it('should return empty object when database throws', async () => {
        mockSupabase.from.mockImplementation(() => {
          throw new Error('Database error');
        });

        const result = await getUserVoteStates(['deal-1']);

        expect(result).toEqual({});
      });
    });
  });

  describe('calculateVoteCounts', () => {
    describe('when dealIds array is empty', () => {
      it('should return empty object', async () => {
        const result = await calculateVoteCounts([]);

        expect(result).toEqual({});
      });
    });

    describe('with votes from multiple users', () => {
      it('should calculate net vote count (+1 for upvote, -1 for downvote)', async () => {
        mockSupabase.from.mockImplementation(() => {
          const mockBuilder = createChainableMock();
          
          Object.defineProperty(mockBuilder, 'then', {
            value: (resolve: (value: unknown) => void) =>
              Promise.resolve({
                data: [
                  // deal-1: 2 upvotes, 1 downvote = +1
                  { deal_id: 'deal-1', user_id: 'user-1', interaction_type: 'upvote', created_at: '2026-01-02' },
                  { deal_id: 'deal-1', user_id: 'user-2', interaction_type: 'upvote', created_at: '2026-01-02' },
                  { deal_id: 'deal-1', user_id: 'user-3', interaction_type: 'downvote', created_at: '2026-01-02' },
                  // deal-2: 0 upvotes, 2 downvotes = -2
                  { deal_id: 'deal-2', user_id: 'user-1', interaction_type: 'downvote', created_at: '2026-01-02' },
                  { deal_id: 'deal-2', user_id: 'user-2', interaction_type: 'downvote', created_at: '2026-01-02' },
                ],
                error: null,
              }).then(resolve),
          });
          
          return mockBuilder;
        });

        const result = await calculateVoteCounts(['deal-1', 'deal-2', 'deal-3']);

        expect(result['deal-1']).toBe(1);  // 2 - 1 = 1
        expect(result['deal-2']).toBe(-2); // 0 - 2 = -2
        expect(result['deal-3']).toBe(0);  // No votes
      });

      it('should use only latest vote per user per deal', async () => {
        mockSupabase.from.mockImplementation(() => {
          const mockBuilder = createChainableMock();
          
          Object.defineProperty(mockBuilder, 'then', {
            value: (resolve: (value: unknown) => void) =>
              Promise.resolve({
                data: [
                  // User 1 changed vote: downvote (latest) vs upvote (older)
                  // Should only count the downvote
                  { deal_id: 'deal-1', user_id: 'user-1', interaction_type: 'downvote', created_at: '2026-01-03' },
                  { deal_id: 'deal-1', user_id: 'user-1', interaction_type: 'upvote', created_at: '2026-01-01' },
                  // User 2 upvote
                  { deal_id: 'deal-1', user_id: 'user-2', interaction_type: 'upvote', created_at: '2026-01-02' },
                ],
                error: null,
              }).then(resolve),
          });
          
          return mockBuilder;
        });

        const result = await calculateVoteCounts(['deal-1']);

        // user-1 downvote (-1) + user-2 upvote (+1) = 0
        expect(result['deal-1']).toBe(0);
      });
    });

    describe('on error', () => {
      it('should return empty object when database throws', async () => {
        mockSupabase.from.mockImplementation(() => {
          throw new Error('Database error');
        });

        const result = await calculateVoteCounts(['deal-1']);

        expect(result).toEqual({});
      });
    });
  });
});

// Type for the mock query builder to satisfy TypeScript
type MockQueryBuilder = ReturnType<typeof mockSupabase.from>;

/**
 * Helper to create a chainable mock for Supabase query builder
 */
function createChainableMock(): MockQueryBuilder {
  const mock = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    gt: jest.fn(),
    gte: jest.fn(),
    lt: jest.fn(),
    lte: jest.fn(),
    like: jest.fn(),
    ilike: jest.fn(),
    is: jest.fn(),
    in: jest.fn(),
    contains: jest.fn(),
    containedBy: jest.fn(),
    range: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn(),
  };

  // Default thenable behavior
  Object.defineProperty(mock, 'then', {
    value: (resolve: (value: unknown) => void) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
    writable: true,
    configurable: true,
  });

  // Make all methods return the mock itself for chaining
  Object.keys(mock).forEach((key) => {
    if (key !== 'single' && key !== 'maybeSingle' && key !== 'then') {
      (mock[key as keyof typeof mock] as jest.Mock).mockReturnValue(mock);
    }
  });

  return mock as MockQueryBuilder;
}
