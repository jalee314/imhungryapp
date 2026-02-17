/**
 * useFeedInteractionHandlers Hook Tests
 *
 * Tests for the shared feed interaction handlers hook that provides
 * optimistic update logic for Feed and CommunityUploadedScreen surfaces.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFeedInteractionHandlers, useSingleDealInteractionHandlers } from '../useFeedInteractionHandlers';
import type { Deal } from '../../components/DealCard';

// Mock the voteService
const mockToggleUpvote = jest.fn();
const mockToggleDownvote = jest.fn();
const mockToggleFavorite = jest.fn();

jest.mock('../../services/voteService', () => ({
  toggleUpvote: (...args: unknown[]) => mockToggleUpvote(...args),
  toggleDownvote: (...args: unknown[]) => mockToggleDownvote(...args),
  toggleFavorite: (...args: unknown[]) => mockToggleFavorite(...args),
}));

// Mock useFavorites hook
const mockMarkAsUnfavorited = jest.fn();
const mockMarkAsFavorited = jest.fn();

jest.mock('../useFavorites', () => ({
  useFavorites: () => ({
    markAsUnfavorited: mockMarkAsUnfavorited,
    markAsFavorited: mockMarkAsFavorited,
  }),
}));

const createMockDeal = (overrides: Partial<Deal> = {}): Deal => ({
  id: 'deal-123',
  title: 'Test Deal',
  restaurant: 'Test Restaurant',
  details: 'Test details',
  image: 'https://example.com/image.jpg',
  votes: 5,
  isUpvoted: false,
  isDownvoted: false,
  isFavorited: false,
  timeAgo: '2h ago',
  ...overrides,
});

describe('useFeedInteractionHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToggleUpvote.mockResolvedValue(true);
    mockToggleDownvote.mockResolvedValue(true);
    mockToggleFavorite.mockResolvedValue(true);
  });

  describe('handleUpvote', () => {
    it('should add upvote and increase vote count', async () => {
      const mockDeal = createMockDeal();
      let deals = [mockDeal];
      const setDeals = jest.fn((updater) => {
        deals = typeof updater === 'function' ? updater(deals) : updater;
      });

      const { result } = renderHook(() =>
        useFeedInteractionHandlers({ deals, setDeals })
      );

      await act(async () => {
        result.current.handleUpvote('deal-123');
      });

      expect(setDeals).toHaveBeenCalled();
      expect(deals[0].isUpvoted).toBe(true);
      expect(deals[0].votes).toBe(6);
      expect(mockToggleUpvote).toHaveBeenCalledWith('deal-123');
    });

    it('should remove upvote and decrease vote count when already upvoted', async () => {
      const mockDeal = createMockDeal({ isUpvoted: true, votes: 6 });
      let deals = [mockDeal];
      const setDeals = jest.fn((updater) => {
        deals = typeof updater === 'function' ? updater(deals) : updater;
      });

      const { result } = renderHook(() =>
        useFeedInteractionHandlers({ deals, setDeals })
      );

      await act(async () => {
        result.current.handleUpvote('deal-123');
      });

      expect(deals[0].isUpvoted).toBe(false);
      expect(deals[0].votes).toBe(5);
    });

    it('should switch from downvote to upvote with +2 vote change', async () => {
      const mockDeal = createMockDeal({ isDownvoted: true, votes: 4 });
      let deals = [mockDeal];
      const setDeals = jest.fn((updater) => {
        deals = typeof updater === 'function' ? updater(deals) : updater;
      });

      const { result } = renderHook(() =>
        useFeedInteractionHandlers({ deals, setDeals })
      );

      await act(async () => {
        result.current.handleUpvote('deal-123');
      });

      expect(deals[0].isUpvoted).toBe(true);
      expect(deals[0].isDownvoted).toBe(false);
      expect(deals[0].votes).toBe(6);
    });

    it('should rollback on server error', async () => {
      mockToggleUpvote.mockRejectedValue(new Error('Network error'));
      
      const mockDeal = createMockDeal();
      let deals = [mockDeal];
      const setDeals = jest.fn((updater) => {
        deals = typeof updater === 'function' ? updater(deals) : updater;
      });

      const { result } = renderHook(() =>
        useFeedInteractionHandlers({ deals, setDeals })
      );

      await act(async () => {
        result.current.handleUpvote('deal-123');
        // Wait for the async error handling
        await new Promise((r) => setTimeout(r, 10));
      });

      // Should have been called twice: once for optimistic, once for rollback
      expect(setDeals).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleDownvote', () => {
    it('should add downvote and decrease vote count', async () => {
      const mockDeal = createMockDeal();
      let deals = [mockDeal];
      const setDeals = jest.fn((updater) => {
        deals = typeof updater === 'function' ? updater(deals) : updater;
      });

      const { result } = renderHook(() =>
        useFeedInteractionHandlers({ deals, setDeals })
      );

      await act(async () => {
        result.current.handleDownvote('deal-123');
      });

      expect(deals[0].isDownvoted).toBe(true);
      expect(deals[0].votes).toBe(4);
      expect(mockToggleDownvote).toHaveBeenCalledWith('deal-123');
    });

    it('should remove downvote and increase vote count when already downvoted', async () => {
      const mockDeal = createMockDeal({ isDownvoted: true, votes: 4 });
      let deals = [mockDeal];
      const setDeals = jest.fn((updater) => {
        deals = typeof updater === 'function' ? updater(deals) : updater;
      });

      const { result } = renderHook(() =>
        useFeedInteractionHandlers({ deals, setDeals })
      );

      await act(async () => {
        result.current.handleDownvote('deal-123');
      });

      expect(deals[0].isDownvoted).toBe(false);
      expect(deals[0].votes).toBe(5);
    });

    it('should switch from upvote to downvote with -2 vote change', async () => {
      const mockDeal = createMockDeal({ isUpvoted: true, votes: 6 });
      let deals = [mockDeal];
      const setDeals = jest.fn((updater) => {
        deals = typeof updater === 'function' ? updater(deals) : updater;
      });

      const { result } = renderHook(() =>
        useFeedInteractionHandlers({ deals, setDeals })
      );

      await act(async () => {
        result.current.handleDownvote('deal-123');
      });

      expect(deals[0].isDownvoted).toBe(true);
      expect(deals[0].isUpvoted).toBe(false);
      expect(deals[0].votes).toBe(4);
    });
  });

  describe('handleFavorite', () => {
    it('should toggle favorite on and notify FavoritesStore', async () => {
      const mockDeal = createMockDeal();
      let deals = [mockDeal];
      const setDeals = jest.fn((updater) => {
        deals = typeof updater === 'function' ? updater(deals) : updater;
      });

      const { result } = renderHook(() =>
        useFeedInteractionHandlers({ deals, setDeals })
      );

      await act(async () => {
        result.current.handleFavorite('deal-123');
      });

      expect(deals[0].isFavorited).toBe(true);
      expect(mockMarkAsFavorited).toHaveBeenCalled();
      expect(mockToggleFavorite).toHaveBeenCalledWith('deal-123', false);
    });

    it('should toggle favorite off and notify FavoritesStore', async () => {
      const mockDeal = createMockDeal({ isFavorited: true });
      let deals = [mockDeal];
      const setDeals = jest.fn((updater) => {
        deals = typeof updater === 'function' ? updater(deals) : updater;
      });

      const { result } = renderHook(() =>
        useFeedInteractionHandlers({ deals, setDeals })
      );

      await act(async () => {
        result.current.handleFavorite('deal-123');
      });

      expect(deals[0].isFavorited).toBe(false);
      expect(mockMarkAsUnfavorited).toHaveBeenCalledWith('deal-123', 'deal');
      expect(mockToggleFavorite).toHaveBeenCalledWith('deal-123', true);
    });

    it('should not update state if deal not found', async () => {
      const mockDeal = createMockDeal({ id: 'other-deal' });
      let deals = [mockDeal];
      const setDeals = jest.fn();

      const { result } = renderHook(() =>
        useFeedInteractionHandlers({ deals, setDeals })
      );

      await act(async () => {
        result.current.handleFavorite('nonexistent-deal');
      });

      expect(setDeals).not.toHaveBeenCalled();
      expect(mockToggleFavorite).not.toHaveBeenCalled();
    });
  });

  describe('state calculation consistency with useOptimisticDealInteractions', () => {
    it('should calculate upvote state consistently', async () => {
      // Test all three upvote scenarios to match useOptimisticDealInteractions
      const scenarios = [
        { initial: { isUpvoted: false, isDownvoted: false, votes: 5 }, expected: { isUpvoted: true, votes: 6 } },
        { initial: { isUpvoted: true, isDownvoted: false, votes: 6 }, expected: { isUpvoted: false, votes: 5 } },
        { initial: { isUpvoted: false, isDownvoted: true, votes: 4 }, expected: { isUpvoted: true, isDownvoted: false, votes: 6 } },
      ];

      for (const scenario of scenarios) {
        const mockDeal = createMockDeal(scenario.initial);
        let deals = [mockDeal];
        const setDeals = jest.fn((updater) => {
          deals = typeof updater === 'function' ? updater(deals) : updater;
        });

        const { result } = renderHook(() =>
          useFeedInteractionHandlers({ deals, setDeals })
        );

        await act(async () => {
          result.current.handleUpvote('deal-123');
        });

        expect(deals[0].isUpvoted).toBe(scenario.expected.isUpvoted);
        expect(deals[0].votes).toBe(scenario.expected.votes);
        if ('isDownvoted' in scenario.expected) {
          expect(deals[0].isDownvoted).toBe(scenario.expected.isDownvoted);
        }
      }
    });

    it('should calculate downvote state consistently', async () => {
      // Test all three downvote scenarios to match useOptimisticDealInteractions
      const scenarios = [
        { initial: { isUpvoted: false, isDownvoted: false, votes: 5 }, expected: { isDownvoted: true, votes: 4 } },
        { initial: { isUpvoted: false, isDownvoted: true, votes: 4 }, expected: { isDownvoted: false, votes: 5 } },
        { initial: { isUpvoted: true, isDownvoted: false, votes: 6 }, expected: { isUpvoted: false, isDownvoted: true, votes: 4 } },
      ];

      for (const scenario of scenarios) {
        const mockDeal = createMockDeal(scenario.initial);
        let deals = [mockDeal];
        const setDeals = jest.fn((updater) => {
          deals = typeof updater === 'function' ? updater(deals) : updater;
        });

        const { result } = renderHook(() =>
          useFeedInteractionHandlers({ deals, setDeals })
        );

        await act(async () => {
          result.current.handleDownvote('deal-123');
        });

        expect(deals[0].isDownvoted).toBe(scenario.expected.isDownvoted);
        expect(deals[0].votes).toBe(scenario.expected.votes);
        if ('isUpvoted' in scenario.expected) {
          expect(deals[0].isUpvoted).toBe(scenario.expected.isUpvoted);
        }
      }
    });
  });
});

// ============================================================
// useSingleDealInteractionHandlers Tests
// ============================================================

describe('useSingleDealInteractionHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToggleUpvote.mockResolvedValue(true);
    mockToggleDownvote.mockResolvedValue(true);
    mockToggleFavorite.mockResolvedValue(true);
  });

  describe('handleUpvote', () => {
    it('should add upvote and increase vote count', async () => {
      let deal = createMockDeal();
      const setDeal = jest.fn((updater) => {
        deal = typeof updater === 'function' ? updater(deal) : updater;
      });

      const { result } = renderHook(() =>
        useSingleDealInteractionHandlers({ deal, setDeal })
      );

      await act(async () => {
        result.current.handleUpvote();
      });

      expect(setDeal).toHaveBeenCalled();
      expect(deal.isUpvoted).toBe(true);
      expect(deal.votes).toBe(6);
      expect(mockToggleUpvote).toHaveBeenCalledWith('deal-123');
    });

    it('should remove upvote and decrease vote count when already upvoted', async () => {
      let deal = createMockDeal({ isUpvoted: true, votes: 6 });
      const setDeal = jest.fn((updater) => {
        deal = typeof updater === 'function' ? updater(deal) : updater;
      });

      const { result } = renderHook(() =>
        useSingleDealInteractionHandlers({ deal, setDeal })
      );

      await act(async () => {
        result.current.handleUpvote();
      });

      expect(deal.isUpvoted).toBe(false);
      expect(deal.votes).toBe(5);
    });

    it('should switch from downvote to upvote with +2 vote change', async () => {
      let deal = createMockDeal({ isDownvoted: true, votes: 4 });
      const setDeal = jest.fn((updater) => {
        deal = typeof updater === 'function' ? updater(deal) : updater;
      });

      const { result } = renderHook(() =>
        useSingleDealInteractionHandlers({ deal, setDeal })
      );

      await act(async () => {
        result.current.handleUpvote();
      });

      expect(deal.isUpvoted).toBe(true);
      expect(deal.isDownvoted).toBe(false);
      expect(deal.votes).toBe(6);
    });

    it('should rollback on server error', async () => {
      mockToggleUpvote.mockRejectedValue(new Error('Network error'));
      
      let deal = createMockDeal();
      const setDeal = jest.fn((updater) => {
        deal = typeof updater === 'function' ? updater(deal) : updater;
      });

      const { result } = renderHook(() =>
        useSingleDealInteractionHandlers({ deal, setDeal })
      );

      await act(async () => {
        result.current.handleUpvote();
        // Wait for the async error handling
        await new Promise((r) => setTimeout(r, 10));
      });

      // Should have been called twice: once for optimistic, once for rollback
      expect(setDeal).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleDownvote', () => {
    it('should add downvote and decrease vote count', async () => {
      let deal = createMockDeal();
      const setDeal = jest.fn((updater) => {
        deal = typeof updater === 'function' ? updater(deal) : updater;
      });

      const { result } = renderHook(() =>
        useSingleDealInteractionHandlers({ deal, setDeal })
      );

      await act(async () => {
        result.current.handleDownvote();
      });

      expect(deal.isDownvoted).toBe(true);
      expect(deal.votes).toBe(4);
      expect(mockToggleDownvote).toHaveBeenCalledWith('deal-123');
    });

    it('should switch from upvote to downvote with -2 vote change', async () => {
      let deal = createMockDeal({ isUpvoted: true, votes: 6 });
      const setDeal = jest.fn((updater) => {
        deal = typeof updater === 'function' ? updater(deal) : updater;
      });

      const { result } = renderHook(() =>
        useSingleDealInteractionHandlers({ deal, setDeal })
      );

      await act(async () => {
        result.current.handleDownvote();
      });

      expect(deal.isDownvoted).toBe(true);
      expect(deal.isUpvoted).toBe(false);
      expect(deal.votes).toBe(4);
    });
  });

  describe('handleFavorite', () => {
    it('should toggle favorite on and notify FavoritesStore', async () => {
      let deal = createMockDeal();
      const setDeal = jest.fn((updater) => {
        deal = typeof updater === 'function' ? updater(deal) : updater;
      });

      const { result } = renderHook(() =>
        useSingleDealInteractionHandlers({ deal, setDeal })
      );

      await act(async () => {
        result.current.handleFavorite();
      });

      expect(deal.isFavorited).toBe(true);
      expect(mockMarkAsFavorited).toHaveBeenCalled();
      expect(mockToggleFavorite).toHaveBeenCalledWith('deal-123', false);
    });

    it('should toggle favorite off and notify FavoritesStore', async () => {
      let deal = createMockDeal({ isFavorited: true });
      const setDeal = jest.fn((updater) => {
        deal = typeof updater === 'function' ? updater(deal) : updater;
      });

      const { result } = renderHook(() =>
        useSingleDealInteractionHandlers({ deal, setDeal })
      );

      await act(async () => {
        result.current.handleFavorite();
      });

      expect(deal.isFavorited).toBe(false);
      expect(mockMarkAsUnfavorited).toHaveBeenCalledWith('deal-123', 'deal');
      expect(mockToggleFavorite).toHaveBeenCalledWith('deal-123', true);
    });

    it('should rollback on server error', async () => {
      mockToggleFavorite.mockRejectedValue(new Error('Network error'));
      
      let deal = createMockDeal();
      const setDeal = jest.fn((updater) => {
        deal = typeof updater === 'function' ? updater(deal) : updater;
      });

      const { result } = renderHook(() =>
        useSingleDealInteractionHandlers({ deal, setDeal })
      );

      await act(async () => {
        result.current.handleFavorite();
        // Wait for the async error handling
        await new Promise((r) => setTimeout(r, 10));
      });

      // Should have been called twice: once for optimistic, once for rollback
      expect(setDeal).toHaveBeenCalledTimes(2);
    });
  });
});
