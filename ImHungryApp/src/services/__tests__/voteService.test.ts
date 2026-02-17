/**
 * Tests for voteService (Facade)
 *
 * These tests verify that voteService correctly delegates to the canonical
 * implementation in features/interactions while maintaining backward compatibility.
 *
 * The voteService facade:
 * - Wraps VoteMutationResult/FavoriteMutationResult to return boolean
 * - Delegates all logic to features/interactions module
 *
 * @since PR-035 - Converted to facade tests
 */

// Mock the features/interactions module
const mockSelectVoteStates = jest.fn();
const mockSelectVoteCounts = jest.fn();
const mockToggleUpvote = jest.fn();
const mockToggleDownvote = jest.fn();
const mockToggleDealFavorite = jest.fn();

jest.mock('../../features/interactions', () => ({
  selectVoteStates: (...args: unknown[]) => mockSelectVoteStates(...args),
  selectVoteCounts: (...args: unknown[]) => mockSelectVoteCounts(...args),
  toggleUpvote: (...args: unknown[]) => mockToggleUpvote(...args),
  toggleDownvote: (...args: unknown[]) => mockToggleDownvote(...args),
  toggleDealFavorite: (...args: unknown[]) => mockToggleDealFavorite(...args),
}));

// Mock the favoritesService clearFavoritesCache
const mockClearFavoritesCache = jest.fn();
jest.mock('../favoritesService', () => ({
  clearFavoritesCache: () => mockClearFavoritesCache(),
}));

import {
  toggleUpvote,
  toggleDownvote,
  toggleFavorite,
  getUserVoteStates,
  calculateVoteCounts,
} from '../voteService';

describe('voteService (Facade)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserVoteStates', () => {
    it('should delegate to selectVoteStates from features/interactions', async () => {
      const expectedStates = {
        'deal-1': { isUpvoted: true, isDownvoted: false, isFavorited: true },
        'deal-2': { isUpvoted: false, isDownvoted: true, isFavorited: false },
      };
      mockSelectVoteStates.mockResolvedValue(expectedStates);

      const result = await getUserVoteStates(['deal-1', 'deal-2']);

      expect(mockSelectVoteStates).toHaveBeenCalledWith(['deal-1', 'deal-2']);
      expect(result).toEqual(expectedStates);
    });

    it('should return empty object when selectVoteStates returns empty', async () => {
      mockSelectVoteStates.mockResolvedValue({});

      const result = await getUserVoteStates([]);

      expect(result).toEqual({});
    });
  });

  describe('calculateVoteCounts', () => {
    it('should delegate to selectVoteCounts from features/interactions', async () => {
      const expectedCounts = {
        'deal-1': 5,
        'deal-2': -2,
      };
      mockSelectVoteCounts.mockResolvedValue(expectedCounts);

      const result = await calculateVoteCounts(['deal-1', 'deal-2']);

      expect(mockSelectVoteCounts).toHaveBeenCalledWith(['deal-1', 'deal-2']);
      expect(result).toEqual(expectedCounts);
    });

    it('should return empty object when selectVoteCounts returns empty', async () => {
      mockSelectVoteCounts.mockResolvedValue({});

      const result = await calculateVoteCounts([]);

      expect(result).toEqual({});
    });
  });

  describe('toggleUpvote', () => {
    it('should return true when canonical toggleUpvote succeeds', async () => {
      mockToggleUpvote.mockResolvedValue({
        success: true,
        newVoteState: { isUpvoted: true, isDownvoted: false, isFavorited: false },
      });

      const result = await toggleUpvote('deal-123');

      expect(mockToggleUpvote).toHaveBeenCalledWith('deal-123');
      expect(result).toBe(true);
    });

    it('should return false when canonical toggleUpvote fails', async () => {
      mockToggleUpvote.mockResolvedValue({
        success: false,
        error: 'User not authenticated',
      });

      const result = await toggleUpvote('deal-123');

      expect(mockToggleUpvote).toHaveBeenCalledWith('deal-123');
      expect(result).toBe(false);
    });
  });

  describe('toggleDownvote', () => {
    it('should return true when canonical toggleDownvote succeeds', async () => {
      mockToggleDownvote.mockResolvedValue({
        success: true,
        newVoteState: { isUpvoted: false, isDownvoted: true, isFavorited: false },
      });

      const result = await toggleDownvote('deal-123');

      expect(mockToggleDownvote).toHaveBeenCalledWith('deal-123');
      expect(result).toBe(true);
    });

    it('should return false when canonical toggleDownvote fails', async () => {
      mockToggleDownvote.mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      const result = await toggleDownvote('deal-123');

      expect(mockToggleDownvote).toHaveBeenCalledWith('deal-123');
      expect(result).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('should return true and clear cache when adding favorite succeeds', async () => {
      mockToggleDealFavorite.mockResolvedValue({
        success: true,
        isFavorited: true,
      });

      const result = await toggleFavorite('deal-123', false);

      expect(mockToggleDealFavorite).toHaveBeenCalledWith('deal-123', false);
      expect(result).toBe(true);
      expect(mockClearFavoritesCache).toHaveBeenCalled();
    });

    it('should return true and clear cache when removing favorite succeeds', async () => {
      mockToggleDealFavorite.mockResolvedValue({
        success: true,
        isFavorited: false,
      });

      const result = await toggleFavorite('deal-123', true);

      expect(mockToggleDealFavorite).toHaveBeenCalledWith('deal-123', true);
      expect(result).toBe(true);
      expect(mockClearFavoritesCache).toHaveBeenCalled();
    });

    it('should return false and not clear cache when favorite toggle fails', async () => {
      mockToggleDealFavorite.mockResolvedValue({
        success: false,
        error: 'User not authenticated',
      });

      const result = await toggleFavorite('deal-123', false);

      expect(mockToggleDealFavorite).toHaveBeenCalledWith('deal-123', false);
      expect(result).toBe(false);
      expect(mockClearFavoritesCache).not.toHaveBeenCalled();
    });
  });
});
