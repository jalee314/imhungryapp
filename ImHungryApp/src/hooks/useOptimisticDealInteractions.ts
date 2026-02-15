/**
 * useOptimisticDealInteractions Hook
 *
 * Canonical hook for optimistic UI updates on deal interactions (upvote, downvote, favorite).
 * Provides clear state transitions and rollback semantics for consistent UX.
 *
 * State Transitions:
 * - idle → pending: Action initiated, optimistic state applied
 * - pending → committed: Server confirmed, state is final
 * - pending → rolledBack: Server failed, state reverted to previous
 * - rolledBack → idle: Ready for next action
 *
 * Rollback Semantics:
 * - On server failure, previous state is immediately restored
 * - All related state (isUpvoted, isDownvoted, isFavorited, voteCount) rolls back atomically
 * - Error callback notified with failure reason
 *
 * @example
 * const { state, actions, isPending } = useOptimisticDealInteractions({
 *   dealId: 'deal-123',
 *   initialState: { isUpvoted: false, isDownvoted: false, isFavorited: false, voteCount: 5 },
 *   onError: (error) => showToast(error),
 * });
 *
 * // Optimistically toggle upvote
 * actions.toggleUpvote();
 */

import { useCallback, useRef, useState } from 'react';
import { toggleUpvote, toggleDownvote, toggleFavorite } from '../services/voteService';
import { useFavoritesStore, type FavoriteDealData } from '../stores/FavoritesStore';

// ==========================================
// Types
// ==========================================

export type TransitionState = 'idle' | 'pending' | 'committed' | 'rolledBack';

export type PendingAction = 'upvote' | 'downvote' | 'favorite' | null;

export interface DealInteractionState {
  isUpvoted: boolean;
  isDownvoted: boolean;
  isFavorited: boolean;
  voteCount: number;
}

export interface UseOptimisticDealInteractionsOptions {
  /** The deal ID for this interaction */
  dealId: string;
  /** Initial interaction state */
  initialState: DealInteractionState;
  /** Callback when server operation fails (for showing toasts, etc.) */
  onError?: (error: string, action: PendingAction) => void;
  /** Callback when state is committed successfully */
  onCommit?: (action: PendingAction, newState: DealInteractionState) => void;
  /** Optional deal data for favorites (needed for instant UI in favorites list) */
  dealData?: Omit<FavoriteDealData, 'favoritedAt'>;
}

export interface UseOptimisticDealInteractionsResult {
  /** Current interaction state (optimistically updated) */
  state: DealInteractionState;
  /** Current transition state for observability */
  transitionState: TransitionState;
  /** Which action is currently pending, if any */
  pendingAction: PendingAction;
  /** Shorthand for checking if any action is pending */
  isPending: boolean;
  /** Actions to trigger optimistic interactions */
  actions: {
    toggleUpvote: () => Promise<void>;
    toggleDownvote: () => Promise<void>;
    toggleFavorite: () => Promise<void>;
  };
  /** Reset state to a new value (useful when server data is refetched) */
  resetState: (newState: DealInteractionState) => void;
}

// ==========================================
// Implementation
// ==========================================

export function useOptimisticDealInteractions(
  options: UseOptimisticDealInteractionsOptions
): UseOptimisticDealInteractionsResult {
  const { dealId, initialState, onError, onCommit, dealData } = options;

  // Current state (includes optimistic updates)
  const [state, setState] = useState<DealInteractionState>(initialState);

  // Transition state for observability
  const [transitionState, setTransitionState] = useState<TransitionState>('idle');

  // Which action is currently pending
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  // Ref to store previous state for rollback
  const previousStateRef = useRef<DealInteractionState | null>(null);

  // Ref to track if an action is in progress (for synchronous check)
  const isActionInProgressRef = useRef<boolean>(false);

  // Access FavoritesStore for local optimistic tracking
  const markAsFavorited = useFavoritesStore((s) => s.markAsFavorited);
  const markAsUnfavorited = useFavoritesStore((s) => s.markAsUnfavorited);

  /**
   * Calculate the new state when toggling upvote
   */
  const calculateUpvoteToggle = useCallback(
    (current: DealInteractionState): DealInteractionState => {
      if (current.isUpvoted) {
        // Remove upvote: -1 to vote count
        return {
          ...current,
          isUpvoted: false,
          voteCount: current.voteCount - 1,
        };
      } else if (current.isDownvoted) {
        // Switch from downvote to upvote: +2 (remove -1 and add +1)
        return {
          ...current,
          isUpvoted: true,
          isDownvoted: false,
          voteCount: current.voteCount + 2,
        };
      } else {
        // Add upvote: +1 to vote count
        return {
          ...current,
          isUpvoted: true,
          voteCount: current.voteCount + 1,
        };
      }
    },
    []
  );

  /**
   * Calculate the new state when toggling downvote
   */
  const calculateDownvoteToggle = useCallback(
    (current: DealInteractionState): DealInteractionState => {
      if (current.isDownvoted) {
        // Remove downvote: +1 to vote count
        return {
          ...current,
          isDownvoted: false,
          voteCount: current.voteCount + 1,
        };
      } else if (current.isUpvoted) {
        // Switch from upvote to downvote: -2 (remove +1 and add -1)
        return {
          ...current,
          isUpvoted: false,
          isDownvoted: true,
          voteCount: current.voteCount - 2,
        };
      } else {
        // Add downvote: -1 to vote count
        return {
          ...current,
          isDownvoted: true,
          voteCount: current.voteCount - 1,
        };
      }
    },
    []
  );

  /**
   * Calculate the new state when toggling favorite
   */
  const calculateFavoriteToggle = useCallback(
    (current: DealInteractionState): DealInteractionState => {
      return {
        ...current,
        isFavorited: !current.isFavorited,
      };
    },
    []
  );

  /**
   * Execute an optimistic action with rollback on failure
   */
  const executeOptimisticAction = useCallback(
    async (
      action: PendingAction,
      calculateNewState: (current: DealInteractionState) => DealInteractionState,
      serverAction: () => Promise<boolean>
    ) => {
      // Use ref for synchronous check to prevent concurrent actions
      if (isActionInProgressRef.current) {
        // Action already in progress, ignore
        return;
      }

      // Mark action as in progress immediately (synchronous)
      isActionInProgressRef.current = true;

      // Capture current state for potential rollback
      previousStateRef.current = state;

      // Calculate and apply optimistic state
      const optimisticState = calculateNewState(state);

      // Transition: idle → pending
      setPendingAction(action);
      setTransitionState('pending');
      setState(optimisticState);

      try {
        // Execute server action
        const success = await serverAction();

        if (success) {
          // Transition: pending → committed
          setTransitionState('committed');
          onCommit?.(action, optimisticState);

          // Reset to idle after brief delay for observability
          setTimeout(() => {
            setTransitionState('idle');
            setPendingAction(null);
            isActionInProgressRef.current = false;
          }, 0);
        } else {
          // Server returned false - rollback
          throw new Error('Server operation failed');
        }
      } catch (error) {
        // Transition: pending → rolledBack
        setTransitionState('rolledBack');

        // Restore previous state
        if (previousStateRef.current) {
          setState(previousStateRef.current);
        }

        // Notify error handler
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onError?.(errorMessage, action);

        // Reset to idle after brief delay for observability
        setTimeout(() => {
          setTransitionState('idle');
          setPendingAction(null);
          isActionInProgressRef.current = false;
        }, 0);
      }
    },
    [state, onError, onCommit]
  );

  /**
   * Toggle upvote with optimistic update
   */
  const handleToggleUpvote = useCallback(async () => {
    await executeOptimisticAction(
      'upvote',
      calculateUpvoteToggle,
      () => toggleUpvote(dealId)
    );
  }, [executeOptimisticAction, calculateUpvoteToggle, dealId]);

  /**
   * Toggle downvote with optimistic update
   */
  const handleToggleDownvote = useCallback(async () => {
    await executeOptimisticAction(
      'downvote',
      calculateDownvoteToggle,
      () => toggleDownvote(dealId)
    );
  }, [executeOptimisticAction, calculateDownvoteToggle, dealId]);

  /**
   * Toggle favorite with optimistic update and local store sync
   */
  const handleToggleFavorite = useCallback(async () => {
    const currentlyFavorited = state.isFavorited;

    // Also update the FavoritesStore for cross-screen consistency
    if (currentlyFavorited) {
      markAsUnfavorited(dealId, 'deal');
    } else if (dealData) {
      markAsFavorited(dealId, 'deal', {
        ...dealData,
        favoritedAt: new Date().toISOString(),
      });
    }

    await executeOptimisticAction(
      'favorite',
      calculateFavoriteToggle,
      () => toggleFavorite(dealId, currentlyFavorited)
    );
  }, [
    state.isFavorited,
    dealId,
    dealData,
    markAsUnfavorited,
    markAsFavorited,
    executeOptimisticAction,
    calculateFavoriteToggle,
  ]);

  /**
   * Reset state to a new value (useful when server data is refetched)
   */
  const resetState = useCallback((newState: DealInteractionState) => {
    setState(newState);
    setTransitionState('idle');
    setPendingAction(null);
    previousStateRef.current = null;
    isActionInProgressRef.current = false;
  }, []);

  return {
    state,
    transitionState,
    pendingAction,
    isPending: pendingAction !== null,
    actions: {
      toggleUpvote: handleToggleUpvote,
      toggleDownvote: handleToggleDownvote,
      toggleFavorite: handleToggleFavorite,
    },
    resetState,
  };
}

// ==========================================
// Utility Types for Consumers
// ==========================================

/**
 * Helper to create initial state from server data
 */
export const createInitialInteractionState = (
  isUpvoted: boolean = false,
  isDownvoted: boolean = false,
  isFavorited: boolean = false,
  voteCount: number = 0
): DealInteractionState => ({
  isUpvoted,
  isDownvoted,
  isFavorited,
  voteCount,
});
