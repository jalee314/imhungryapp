/**
 * useOptimisticDealInteractions Hook Tests
 *
 * Unit tests verifying optimistic state transitions and rollback semantics.
 * These tests document the canonical behavior of the hook for all transition paths.
 *
 * Transition Paths:
 * - idle → pending → committed (success case)
 * - idle → pending → rolledBack (failure case)
 * - Concurrent action prevention (action while pending)
 *
 * State Transitions Tested:
 * - Upvote: toggle on, toggle off, switch from downvote
 * - Downvote: toggle on, toggle off, switch from upvote
 * - Favorite: toggle on, toggle off
 * - Vote count changes with each transition
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

import { useFavoritesStore } from '../../stores/FavoritesStore';
import {
  useOptimisticDealInteractions,
  createInitialInteractionState,
  DealInteractionState,
} from '../useOptimisticDealInteractions';

// Mock the voteService
const mockToggleUpvote = jest.fn();
const mockToggleDownvote = jest.fn();
const mockToggleFavorite = jest.fn();

jest.mock('../../services/voteService', () => ({
  toggleUpvote: (...args: unknown[]) => mockToggleUpvote(...args),
  toggleDownvote: (...args: unknown[]) => mockToggleDownvote(...args),
  toggleFavorite: (...args: unknown[]) => mockToggleFavorite(...args),
}));

describe('useOptimisticDealInteractions', () => {
  const defaultDealId = 'deal-123';
  const defaultInitialState: DealInteractionState = {
    isUpvoted: false,
    isDownvoted: false,
    isFavorited: false,
    voteCount: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset FavoritesStore
    useFavoritesStore.setState({
      unfavoritedItems: new Set(),
      unfavoritedRestaurants: new Set(),
      newlyFavoritedDeals: new Map(),
    });
    // Default to successful server operations
    mockToggleUpvote.mockResolvedValue(true);
    mockToggleDownvote.mockResolvedValue(true);
    mockToggleFavorite.mockResolvedValue(true);
  });

  describe('Initial State', () => {
    it('should initialize with the provided initial state', () => {
      const { result } = renderHook(() =>
        useOptimisticDealInteractions({
          dealId: defaultDealId,
          initialState: defaultInitialState,
        })
      );

      expect(result.current.state).toEqual(defaultInitialState);
      expect(result.current.transitionState).toBe('idle');
      expect(result.current.pendingAction).toBeNull();
      expect(result.current.isPending).toBe(false);
    });

    it('should initialize with custom state values', () => {
      const customState: DealInteractionState = {
        isUpvoted: true,
        isDownvoted: false,
        isFavorited: true,
        voteCount: 42,
      };

      const { result } = renderHook(() =>
        useOptimisticDealInteractions({
          dealId: defaultDealId,
          initialState: customState,
        })
      );

      expect(result.current.state).toEqual(customState);
    });
  });

  describe('createInitialInteractionState helper', () => {
    it('should create default state with all false and zero votes', () => {
      expect(createInitialInteractionState()).toEqual({
        isUpvoted: false,
        isDownvoted: false,
        isFavorited: false,
        voteCount: 0,
      });
    });

    it('should create state with provided values', () => {
      expect(createInitialInteractionState(true, false, true, 10)).toEqual({
        isUpvoted: true,
        isDownvoted: false,
        isFavorited: true,
        voteCount: 10,
      });
    });
  });

  describe('toggleUpvote transitions', () => {
    describe('when not upvoted (toggle on)', () => {
      it('should optimistically update state to upvoted with +1 vote', async () => {
        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: defaultInitialState,
          })
        );

        await act(async () => {
          result.current.actions.toggleUpvote();
        });

        expect(result.current.state.isUpvoted).toBe(true);
        expect(result.current.state.voteCount).toBe(6);
      });

      it('should transition idle → pending → committed on success', async () => {
        // Use a delayed mock to capture intermediate states
        let resolveServerCall: (value: boolean) => void;
        mockToggleUpvote.mockImplementation(
          () => new Promise((resolve) => { resolveServerCall = resolve; })
        );

        const onCommit = jest.fn();
        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: defaultInitialState,
            onCommit,
          })
        );

        // Start the action (don't await yet)
        let actionPromise: Promise<void>;
        act(() => {
          actionPromise = result.current.actions.toggleUpvote();
        });

        // Now state should be pending
        expect(result.current.transitionState).toBe('pending');
        expect(result.current.pendingAction).toBe('upvote');
        expect(result.current.isPending).toBe(true);

        // Resolve the server call
        await act(async () => {
          resolveServerCall!(true);
          await actionPromise!;
        });

        expect(mockToggleUpvote).toHaveBeenCalledWith(defaultDealId);
        expect(onCommit).toHaveBeenCalledWith('upvote', expect.objectContaining({
          isUpvoted: true,
          voteCount: 6,
        }));
      });
    });

    describe('when already upvoted (toggle off)', () => {
      it('should optimistically remove upvote with -1 vote', async () => {
        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: { ...defaultInitialState, isUpvoted: true, voteCount: 6 },
          })
        );

        await act(async () => {
          await result.current.actions.toggleUpvote();
        });

        expect(result.current.state.isUpvoted).toBe(false);
        expect(result.current.state.voteCount).toBe(5);
      });
    });

    describe('when downvoted (switch vote)', () => {
      it('should switch from downvote to upvote with +2 votes', async () => {
        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: { ...defaultInitialState, isDownvoted: true, voteCount: 4 },
          })
        );

        await act(async () => {
          await result.current.actions.toggleUpvote();
        });

        expect(result.current.state.isUpvoted).toBe(true);
        expect(result.current.state.isDownvoted).toBe(false);
        expect(result.current.state.voteCount).toBe(6); // +2 (remove -1, add +1)
      });
    });

    describe('on server failure (rollback)', () => {
      it('should rollback state and call onError', async () => {
        mockToggleUpvote.mockResolvedValue(false);
        const onError = jest.fn();

        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: defaultInitialState,
            onError,
          })
        );

        await act(async () => {
          await result.current.actions.toggleUpvote();
        });

        // State should rollback to original
        expect(result.current.state.isUpvoted).toBe(false);
        expect(result.current.state.voteCount).toBe(5);
        expect(onError).toHaveBeenCalledWith('Server operation failed', 'upvote');
      });

      it('should transition idle → pending → rolledBack on failure', async () => {
        mockToggleUpvote.mockRejectedValue(new Error('Network error'));
        const onError = jest.fn();

        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: defaultInitialState,
            onError,
          })
        );

        await act(async () => {
          await result.current.actions.toggleUpvote();
        });

        expect(onError).toHaveBeenCalledWith('Network error', 'upvote');
        expect(result.current.state).toEqual(defaultInitialState);
      });
    });
  });

  describe('toggleDownvote transitions', () => {
    describe('when not downvoted (toggle on)', () => {
      it('should optimistically update state to downvoted with -1 vote', async () => {
        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: defaultInitialState,
          })
        );

        await act(async () => {
          await result.current.actions.toggleDownvote();
        });

        expect(result.current.state.isDownvoted).toBe(true);
        expect(result.current.state.voteCount).toBe(4);
      });
    });

    describe('when already downvoted (toggle off)', () => {
      it('should optimistically remove downvote with +1 vote', async () => {
        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: { ...defaultInitialState, isDownvoted: true, voteCount: 4 },
          })
        );

        await act(async () => {
          await result.current.actions.toggleDownvote();
        });

        expect(result.current.state.isDownvoted).toBe(false);
        expect(result.current.state.voteCount).toBe(5);
      });
    });

    describe('when upvoted (switch vote)', () => {
      it('should switch from upvote to downvote with -2 votes', async () => {
        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: { ...defaultInitialState, isUpvoted: true, voteCount: 6 },
          })
        );

        await act(async () => {
          await result.current.actions.toggleDownvote();
        });

        expect(result.current.state.isUpvoted).toBe(false);
        expect(result.current.state.isDownvoted).toBe(true);
        expect(result.current.state.voteCount).toBe(4); // -2 (remove +1, add -1)
      });
    });

    describe('on server failure (rollback)', () => {
      it('should rollback state to previous value', async () => {
        mockToggleDownvote.mockResolvedValue(false);
        const onError = jest.fn();

        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: defaultInitialState,
            onError,
          })
        );

        await act(async () => {
          await result.current.actions.toggleDownvote();
        });

        expect(result.current.state.isDownvoted).toBe(false);
        expect(result.current.state.voteCount).toBe(5);
        expect(onError).toHaveBeenCalledWith('Server operation failed', 'downvote');
      });
    });
  });

  describe('toggleFavorite transitions', () => {
    describe('when not favorited (toggle on)', () => {
      it('should optimistically update state to favorited', async () => {
        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: defaultInitialState,
          })
        );

        await act(async () => {
          await result.current.actions.toggleFavorite();
        });

        expect(result.current.state.isFavorited).toBe(true);
        // Vote count should not change
        expect(result.current.state.voteCount).toBe(5);
      });

      it('should call toggleFavorite with currentlyFavorited=false', async () => {
        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: defaultInitialState,
          })
        );

        await act(async () => {
          await result.current.actions.toggleFavorite();
        });

        expect(mockToggleFavorite).toHaveBeenCalledWith(defaultDealId, false);
      });

      it('should update FavoritesStore when dealData is provided', async () => {
        const dealData = {
          id: defaultDealId,
          title: 'Test Deal',
          description: 'Great deal',
          imageUrl: 'https://example.com/image.jpg',
          restaurantName: 'Test Restaurant',
          restaurantAddress: '123 Main St',
          distance: '1.2 mi',
        };

        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: defaultInitialState,
            dealData,
          })
        );

        await act(async () => {
          await result.current.actions.toggleFavorite();
        });

        const storeState = useFavoritesStore.getState();
        expect(storeState.newlyFavoritedDeals.has(defaultDealId)).toBe(true);
      });
    });

    describe('when favorited (toggle off)', () => {
      it('should optimistically update state to unfavorited', async () => {
        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: { ...defaultInitialState, isFavorited: true },
          })
        );

        await act(async () => {
          await result.current.actions.toggleFavorite();
        });

        expect(result.current.state.isFavorited).toBe(false);
      });

      it('should call toggleFavorite with currentlyFavorited=true', async () => {
        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: { ...defaultInitialState, isFavorited: true },
          })
        );

        await act(async () => {
          await result.current.actions.toggleFavorite();
        });

        expect(mockToggleFavorite).toHaveBeenCalledWith(defaultDealId, true);
      });

      it('should update FavoritesStore to mark as unfavorited', async () => {
        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: { ...defaultInitialState, isFavorited: true },
          })
        );

        await act(async () => {
          await result.current.actions.toggleFavorite();
        });

        const storeState = useFavoritesStore.getState();
        expect(storeState.unfavoritedItems.has(defaultDealId)).toBe(true);
      });
    });

    describe('on server failure (rollback)', () => {
      it('should rollback state to previous value', async () => {
        mockToggleFavorite.mockResolvedValue(false);
        const onError = jest.fn();

        const { result } = renderHook(() =>
          useOptimisticDealInteractions({
            dealId: defaultDealId,
            initialState: defaultInitialState,
            onError,
          })
        );

        await act(async () => {
          await result.current.actions.toggleFavorite();
        });

        expect(result.current.state.isFavorited).toBe(false);
        expect(onError).toHaveBeenCalledWith('Server operation failed', 'favorite');
      });
    });
  });

  describe('Concurrent action prevention', () => {
    it('should ignore actions when another action is pending', async () => {
      // Use a delayed mock for upvote
      let resolveUpvote: (value: boolean) => void;
      mockToggleUpvote.mockImplementation(
        () => new Promise((resolve) => { resolveUpvote = resolve; })
      );

      const { result } = renderHook(() =>
        useOptimisticDealInteractions({
          dealId: defaultDealId,
          initialState: defaultInitialState,
        })
      );

      // Start first action (don't await yet)
      let promise1: Promise<void>;
      act(() => {
        promise1 = result.current.actions.toggleUpvote();
      });

      // Verify we're in pending state
      expect(result.current.isPending).toBe(true);

      // Try to start second action while first is pending
      await act(async () => {
        await result.current.actions.toggleDownvote();
      });

      // Resolve the first action
      await act(async () => {
        resolveUpvote!(true);
        await promise1!;
      });

      // Only upvote should have been processed
      expect(mockToggleUpvote).toHaveBeenCalledTimes(1);
      expect(mockToggleDownvote).not.toHaveBeenCalled();
      expect(result.current.state.isUpvoted).toBe(true);
      expect(result.current.state.isDownvoted).toBe(false);
    });
  });

  describe('resetState', () => {
    it('should reset state to new values', async () => {
      const { result } = renderHook(() =>
        useOptimisticDealInteractions({
          dealId: defaultDealId,
          initialState: defaultInitialState,
        })
      );

      // First toggle upvote
      await act(async () => {
        await result.current.actions.toggleUpvote();
      });

      expect(result.current.state.isUpvoted).toBe(true);

      // Then reset state
      const newState: DealInteractionState = {
        isUpvoted: false,
        isDownvoted: true,
        isFavorited: true,
        voteCount: 10,
      };

      act(() => {
        result.current.resetState(newState);
      });

      expect(result.current.state).toEqual(newState);
      expect(result.current.transitionState).toBe('idle');
      expect(result.current.pendingAction).toBeNull();
    });
  });

  describe('Atomic rollback', () => {
    it('should rollback all state atomically on failure', async () => {
      mockToggleUpvote.mockResolvedValue(false);

      const initialState: DealInteractionState = {
        isUpvoted: false,
        isDownvoted: true,
        isFavorited: true,
        voteCount: 4,
      };

      const { result } = renderHook(() =>
        useOptimisticDealInteractions({
          dealId: defaultDealId,
          initialState,
        })
      );

      await act(async () => {
        await result.current.actions.toggleUpvote();
      });

      // All state should rollback atomically
      expect(result.current.state).toEqual(initialState);
    });
  });

  describe('Integration with callbacks', () => {
    it('should call onCommit with action and new state on success', async () => {
      const onCommit = jest.fn();

      const { result } = renderHook(() =>
        useOptimisticDealInteractions({
          dealId: defaultDealId,
          initialState: defaultInitialState,
          onCommit,
        })
      );

      await act(async () => {
        await result.current.actions.toggleFavorite();
      });

      expect(onCommit).toHaveBeenCalledWith('favorite', {
        isUpvoted: false,
        isDownvoted: false,
        isFavorited: true,
        voteCount: 5,
      });
    });

    it('should call onError with error message and action on failure', async () => {
      mockToggleFavorite.mockRejectedValue(new Error('Custom error message'));
      const onError = jest.fn();

      const { result } = renderHook(() =>
        useOptimisticDealInteractions({
          dealId: defaultDealId,
          initialState: defaultInitialState,
          onError,
        })
      );

      await act(async () => {
        await result.current.actions.toggleFavorite();
      });

      expect(onError).toHaveBeenCalledWith('Custom error message', 'favorite');
    });
  });
});
