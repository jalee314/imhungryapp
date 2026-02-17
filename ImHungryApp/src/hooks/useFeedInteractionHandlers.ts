/**
 * useFeedInteractionHandlers Hook
 *
 * Shared hook for managing deal interactions in feed surfaces (Feed, CommunityUploadedScreen).
 * Applies the same optimistic update patterns as useOptimisticDealInteractions but designed
 * for list-based deal management.
 *
 * Key Features:
 * - Synchronous optimistic updates (no setTimeout to prevent flicker)
 * - Automatic rollback on server failure
 * - FavoritesStore integration for cross-screen consistency
 *
 * @see useOptimisticDealInteractions for single-deal state management
 */

import { useCallback } from 'react';
import type { Deal } from '../components/DealCard';
import { toggleUpvote, toggleDownvote, toggleFavorite } from '../services/voteService';
import { useFavorites } from './useFavorites';
import type { DealInteractionState } from './useOptimisticDealInteractions';

export interface UseFeedInteractionHandlersOptions {
  /** The current deals array */
  deals: Deal[];
  /** State setter for the deals array */
  setDeals: React.Dispatch<React.SetStateAction<Deal[]>>;
}

export interface FeedInteractionHandlers {
  handleUpvote: (dealId: string) => void;
  handleDownvote: (dealId: string) => void;
  handleFavorite: (dealId: string) => void;
}

// ==========================================
// Exported Calculation Utilities
// ==========================================

/**
 * Calculate new interaction state when toggling upvote
 * Mirrors calculateUpvoteToggle from useOptimisticDealInteractions
 * Exported for use in single-deal surfaces (DealDetailScreen, etc.)
 */
export const calculateUpvoteToggle = (deal: Deal): Partial<Deal> => {
  if (deal.isUpvoted) {
    // Remove upvote: -1 to vote count
    return {
      isUpvoted: false,
      votes: deal.votes - 1,
    };
  } else if (deal.isDownvoted) {
    // Switch from downvote to upvote: +2 (remove -1 and add +1)
    return {
      isUpvoted: true,
      isDownvoted: false,
      votes: deal.votes + 2,
    };
  } else {
    // Add upvote: +1 to vote count
    return {
      isUpvoted: true,
      votes: deal.votes + 1,
    };
  }
};

/**
 * Calculate new interaction state when toggling downvote
 * Mirrors calculateDownvoteToggle from useOptimisticDealInteractions
 * Exported for use in single-deal surfaces (DealDetailScreen, etc.)
 */
export const calculateDownvoteToggle = (deal: Deal): Partial<Deal> => {
  if (deal.isDownvoted) {
    // Remove downvote: +1 to vote count
    return {
      isDownvoted: false,
      votes: deal.votes + 1,
    };
  } else if (deal.isUpvoted) {
    // Switch from upvote to downvote: -2 (remove +1 and add -1)
    return {
      isUpvoted: false,
      isDownvoted: true,
      votes: deal.votes - 2,
    };
  } else {
    // Add downvote: -1 to vote count
    return {
      isDownvoted: true,
      votes: deal.votes - 1,
    };
  }
};

/**
 * Hook for creating interaction handlers for feed surfaces.
 * Encapsulates optimistic update logic with automatic rollback on server failure.
 */
export function useFeedInteractionHandlers(
  options: UseFeedInteractionHandlersOptions
): FeedInteractionHandlers {
  const { deals, setDeals } = options;
  const { markAsUnfavorited, markAsFavorited } = useFavorites();

  /**
   * Handle upvote with optimistic update and rollback on failure
   */
  const handleUpvote = useCallback(
    (dealId: string) => {
      let originalDeal: Deal | undefined;

      // Synchronous optimistic update - no setTimeout to prevent flicker
      setDeals((prevDeals) => {
        return prevDeals.map((d) => {
          if (d.id === dealId) {
            originalDeal = d;
            const changes = calculateUpvoteToggle(d);
            return { ...d, ...changes };
          }
          return d;
        });
      });

      // Background database save with rollback on error
      toggleUpvote(dealId).catch((err) => {
        console.error('Failed to save upvote, reverting:', err);
        if (originalDeal) {
          setDeals((prevDeals) =>
            prevDeals.map((d) => (d.id === dealId ? originalDeal! : d))
          );
        }
      });
    },
    [setDeals]
  );

  /**
   * Handle downvote with optimistic update and rollback on failure
   */
  const handleDownvote = useCallback(
    (dealId: string) => {
      let originalDeal: Deal | undefined;

      // Synchronous optimistic update - no setTimeout to prevent flicker
      setDeals((prevDeals) => {
        return prevDeals.map((d) => {
          if (d.id === dealId) {
            originalDeal = d;
            const changes = calculateDownvoteToggle(d);
            return { ...d, ...changes };
          }
          return d;
        });
      });

      // Background database save with rollback on error
      toggleDownvote(dealId).catch((err) => {
        console.error('Failed to save downvote, reverting:', err);
        if (originalDeal) {
          setDeals((prevDeals) =>
            prevDeals.map((d) => (d.id === dealId ? originalDeal! : d))
          );
        }
      });
    },
    [setDeals]
  );

  /**
   * Handle favorite with optimistic update, FavoritesStore sync, and rollback on failure
   */
  const handleFavorite = useCallback(
    (dealId: string) => {
      const originalDeal = deals.find((d) => d.id === dealId);
      if (!originalDeal) return;

      const wasFavorited = originalDeal.isFavorited;

      // 1. Optimistic UI update
      setDeals((prevDeals) =>
        prevDeals.map((d) =>
          d.id === dealId ? { ...d, isFavorited: !wasFavorited } : d
        )
      );

      // 2. Notify global store for instant favorites page update
      if (wasFavorited) {
        markAsUnfavorited(dealId, 'deal');
      } else {
        // Pass full deal data for instant display in favorites
        markAsFavorited(dealId, 'deal', {
          id: originalDeal.id,
          title: originalDeal.title,
          description: originalDeal.details || '',
          imageUrl:
            typeof originalDeal.image === 'object' ? originalDeal.image.uri : '',
          restaurantName: originalDeal.restaurant,
          restaurantAddress: originalDeal.restaurantAddress || '',
          distance: originalDeal.milesAway || '',
          userId: originalDeal.userId,
          userDisplayName: originalDeal.userDisplayName,
          userProfilePhoto: originalDeal.userProfilePhoto,
          isAnonymous: originalDeal.isAnonymous,
          favoritedAt: new Date().toISOString(),
        });
      }

      // 3. Background database save with rollback on error
      toggleFavorite(dealId, wasFavorited).catch((err) => {
        console.error('Failed to save favorite, reverting:', err);
        setDeals((prevDeals) =>
          prevDeals.map((d) => (d.id === dealId ? originalDeal : d))
        );
      });
    },
    [deals, setDeals, markAsUnfavorited, markAsFavorited]
  );

  return {
    handleUpvote,
    handleDownvote,
    handleFavorite,
  };
}

// ==========================================
// Single-Deal Interaction Handlers
// ==========================================

export interface UseSingleDealInteractionHandlersOptions {
  /** Current deal state */
  deal: Deal;
  /** State setter for the deal */
  setDeal: React.Dispatch<React.SetStateAction<Deal>>;
}

export interface SingleDealInteractionHandlers {
  handleUpvote: () => void;
  handleDownvote: () => void;
  handleFavorite: () => void;
}

/**
 * Hook for creating interaction handlers for single-deal surfaces (DealDetailScreen).
 * Encapsulates optimistic update logic with automatic rollback on server failure.
 */
export function useSingleDealInteractionHandlers(
  options: UseSingleDealInteractionHandlersOptions
): SingleDealInteractionHandlers {
  const { deal, setDeal } = options;
  const { markAsUnfavorited, markAsFavorited } = useFavorites();

  /**
   * Handle upvote with optimistic update and rollback on failure
   */
  const handleUpvote = useCallback(() => {
    const previousState = { ...deal };
    const changes = calculateUpvoteToggle(deal);

    // Synchronous optimistic update
    setDeal({ ...previousState, ...changes });

    // Background database save with rollback on error
    toggleUpvote(deal.id).catch((err) => {
      console.error('Failed to save upvote, reverting:', err);
      setDeal(previousState);
    });
  }, [deal, setDeal]);

  /**
   * Handle downvote with optimistic update and rollback on failure
   */
  const handleDownvote = useCallback(() => {
    const previousState = { ...deal };
    const changes = calculateDownvoteToggle(deal);

    // Synchronous optimistic update
    setDeal({ ...previousState, ...changes });

    // Background database save with rollback on error
    toggleDownvote(deal.id).catch((err) => {
      console.error('Failed to save downvote, reverting:', err);
      setDeal(previousState);
    });
  }, [deal, setDeal]);

  /**
   * Handle favorite with optimistic update, FavoritesStore sync, and rollback on failure
   */
  const handleFavorite = useCallback(() => {
    const previousState = { ...deal };
    const wasFavorited = deal.isFavorited;

    // 1. Optimistic UI update
    setDeal({ ...previousState, isFavorited: !wasFavorited });

    // 2. Notify global store for instant favorites page update
    if (wasFavorited) {
      markAsUnfavorited(deal.id, 'deal');
    } else {
      markAsFavorited(deal.id, 'deal', {
        id: deal.id,
        title: deal.title,
        description: deal.details || '',
        imageUrl: typeof deal.image === 'object' ? deal.image.uri : '',
        restaurantName: deal.restaurant,
        restaurantAddress: deal.restaurantAddress || '',
        distance: deal.milesAway || '',
        userId: deal.userId,
        userDisplayName: deal.userDisplayName,
        userProfilePhoto: deal.userProfilePhoto,
        isAnonymous: deal.isAnonymous,
        favoritedAt: new Date().toISOString(),
      });
    }

    // 3. Background database save with rollback on error
    toggleFavorite(deal.id, wasFavorited).catch((err) => {
      console.error('Failed to save favorite, reverting:', err);
      setDeal(previousState);
    });
  }, [deal, setDeal, markAsUnfavorited, markAsFavorited]);

  return {
    handleUpvote,
    handleDownvote,
    handleFavorite,
  };
}
