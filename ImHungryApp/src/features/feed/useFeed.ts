/**
 * @file useFeed — Headless hook that owns all Feed state & side-effects.
 *
 * Extracted from the original Feed screen monolith so section
 * components can remain purely presentational.
 */

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RealtimeChannel } from '@supabase/supabase-js';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { supabase } from '../../../lib/supabase';
import { useDataCache } from '../../hooks/useDataCache';
import { useDealUpdate } from '../../hooks/useDealUpdate';
import { useFeedInteractionHandlers } from '../../hooks/useFeedInteractionHandlers';
import { useLocation } from '../../hooks/useLocation';
import { getCurrentUserId } from '../../services/currentUserService';
import { dealCacheService } from '../../services/dealCacheService';
import { logClick } from '../../services/interactionService';
import type { Deal } from '../../types/deal';
import { startPerfSpan } from '../../utils/perfMonitor';

import type { FeedContext } from './types';

type VoteInteractionType = 'upvote' | 'downvote';
type VoteEventType = 'INSERT' | 'DELETE';

const VOTE_DELTAS: Record<VoteEventType, Record<VoteInteractionType, number>> = {
  INSERT: {
    upvote: 1,
    downvote: -1,
  },
  DELETE: {
    upvote: -1,
    downvote: 1,
  },
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFeed(): FeedContext {
  const navigation = useNavigation();
  const { getUpdatedDeal, clearUpdatedDeal, postAdded, setPostAdded } = useDealUpdate();
  const { cuisines, loading: cuisinesLoading } = useDataCache();
  const {
    selectedCoordinates,
    hasLocationSet,
    isInitialLoad,
    isLoading: isLocationLoading,
  } = useLocation();

  // ----- Core state ---------------------------------------------------------
  const [selectedCuisineId, setSelectedCuisineId] = useState<string>('All');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Interaction handlers (optimistic updates)
  const { handleUpvote, handleDownvote, handleFavorite } = useFeedInteractionHandlers({
    deals,
    setDeals,
  });

  // Realtime refs
  const interactionChannel = useRef<RealtimeChannel | null>(null);
  const favoriteChannel = useRef<RealtimeChannel | null>(null);
  const recentActions = useRef<Set<string>>(new Set());

  // ----- Load deals ---------------------------------------------------------
  const loadDeals = useCallback(async () => {
    const span = startPerfSpan('screen.feed.load', {
      hasCoordinates: Boolean(selectedCoordinates),
      hasExistingDeals: deals.length > 0,
    });
    let spanClosed = false;
    let loadedDealsCount = 0;

    try {
      if (deals.length === 0) setLoading(true);
      const cachedDeals = await dealCacheService.getDeals(false, selectedCoordinates || undefined);
      loadedDealsCount = cachedDeals.length;
      span.recordRoundTrip({ source: 'dealCacheService.getDeals', deals: cachedDeals.length });
      span.addPayload(cachedDeals);
      setDeals(cachedDeals);
      setError(null);
    } catch (err) {
      console.error('Error loading deals:', err);
      setError('Failed to load deals. Please try again.');
      span.end({ success: false, error: err });
      spanClosed = true;
    } finally {
      setLoading(false);
      if (!spanClosed) {
        span.end({ metadata: { dealsLoaded: loadedDealsCount } });
      }
    }
  }, [deals.length, selectedCoordinates]);

  // Location-driven deal loading
  useEffect(() => {
    if (isInitialLoad) return;

    if (hasLocationSet) {
      loadDeals();
      dealCacheService.initializeRealtime(selectedCoordinates || undefined);
      const unsubscribe = dealCacheService.subscribe((updatedDeals) => {
        setDeals(updatedDeals);
      });
      return () => unsubscribe();
    }

    setLoading(false);
  }, [selectedCoordinates, hasLocationSet, isInitialLoad]);

  // ----- Realtime subscriptions ---------------------------------------------
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const userId = await getCurrentUserId();
      if (!userId) return;

      if (interactionChannel.current) {
        supabase.removeChannel(interactionChannel.current);
        interactionChannel.current = null;
      }
      if (favoriteChannel.current) {
        supabase.removeChannel(favoriteChannel.current);
        favoriteChannel.current = null;
      }

      const applyVoteDelta = (dealId: string, delta: number): void => {
        setDeals((previousDeals) =>
          previousDeals.map((deal) => {
            if (deal.id !== dealId) return deal;
            return {
              ...deal,
              votes: deal.votes + delta,
            };
          }),
        );
      };

      const handleVoteEvent =
        (eventType: VoteEventType, interactionType: VoteInteractionType) => (payload: any) => {
          const interaction = payload.new || payload.old;
          if (!interaction?.deal_id || !interaction.interaction_type) return;
          if (interaction.user_id === userId) return;

          const actionKey = [
            eventType,
            interaction.deal_id,
            interaction.user_id,
            interaction.interaction_type,
            payload.commit_timestamp,
          ]
            .filter(Boolean)
            .join(':');

          if (recentActions.current.has(actionKey)) return;
          recentActions.current.add(actionKey);
          setTimeout(() => {
            recentActions.current.delete(actionKey);
          }, 1000);

          const delta = VOTE_DELTAS[eventType][interactionType];
          applyVoteDelta(interaction.deal_id, delta);
        };

      interactionChannel.current = supabase
        .channel('feed-vote-interactions')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'interaction',
            filter: 'interaction_type=eq.upvote',
          },
          handleVoteEvent('INSERT', 'upvote'),
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'interaction',
            filter: 'interaction_type=eq.upvote',
          },
          handleVoteEvent('DELETE', 'upvote'),
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'interaction',
            filter: 'interaction_type=eq.downvote',
          },
          handleVoteEvent('INSERT', 'downvote'),
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'interaction',
            filter: 'interaction_type=eq.downvote',
          },
          handleVoteEvent('DELETE', 'downvote'),
        )
        .subscribe();

      favoriteChannel.current = supabase
        .channel('user-favorites')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'favorite',
            filter: `user_id=eq.${userId}`,
          },
          (payload: { new?: { deal_id?: string } }) => {
            const dealId = payload.new?.deal_id;
            if (!dealId) return;
            setDeals((prevDeals) =>
              prevDeals.map((deal) =>
                deal.id === dealId ? { ...deal, isFavorited: true } : deal,
              ),
            );
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'favorite',
            filter: `user_id=eq.${userId}`,
          },
          (payload: { old?: { deal_id?: string } }) => {
            const dealId = payload.old?.deal_id;
            if (!dealId) return;
            setDeals((prevDeals) =>
              prevDeals.map((deal) =>
                deal.id === dealId ? { ...deal, isFavorited: false } : deal,
              ),
            );
          },
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (interactionChannel.current) supabase.removeChannel(interactionChannel.current);
      if (favoriteChannel.current) supabase.removeChannel(favoriteChannel.current);
      recentActions.current.clear();
    };
  }, []);

  // ----- Focus sync ---------------------------------------------------------
  useFocusEffect(
    React.useCallback(() => {
      const syncWithCache = async () => {
        if (postAdded) {
          console.log('📸 Feed: postAdded detected, syncing with fresh cache');
          const cachedDeals = dealCacheService.getCachedDeals();
          if (cachedDeals.length > 0) {
            setDeals(cachedDeals);
          }
          setPostAdded(false);
          return;
        }

        const cachedDeals = dealCacheService.getCachedDeals();
        if (cachedDeals.length > 0) {
          setDeals((prevDeals) => {
            const hasChanges = cachedDeals.some((cachedDeal) => {
              const currentDeal = prevDeals.find((d) => d.id === cachedDeal.id);
              if (!currentDeal) return true;

              if (cachedDeal.isAnonymous !== currentDeal.isAnonymous) return true;
              if (cachedDeal.author !== currentDeal.author) return true;
              if (cachedDeal.title !== currentDeal.title) return true;
              if (cachedDeal.details !== currentDeal.details) return true;

              const cachedVariants = cachedDeal.imageVariants;
              const currentVariants = currentDeal.imageVariants;
              if (!cachedVariants && !currentVariants) return false;
              if (!cachedVariants || !currentVariants) return true;
              return (
                cachedVariants.medium !== currentVariants.medium ||
                cachedVariants.small !== currentVariants.small ||
                cachedVariants.thumbnail !== currentVariants.thumbnail
              );
            });

            if (hasChanges || cachedDeals.length !== prevDeals.length) {
              console.log('📸 Feed: Detected deal changes, syncing with cache');
              return cachedDeals;
            }
            return prevDeals;
          });
        }
      };
      syncWithCache();

      const timeoutId = setTimeout(() => {
        setDeals((prevDeals) => {
          let hasChanges = false;
          const dealIdsToClear: string[] = [];
          const updatedDeals = prevDeals.map((deal) => {
            const updatedDeal = getUpdatedDeal(deal.id);
            if (updatedDeal) {
              hasChanges = true;
              dealIdsToClear.push(deal.id);
              return updatedDeal;
            }
            return deal;
          });

          if (hasChanges) {
            setTimeout(() => {
              dealIdsToClear.forEach((id) => clearUpdatedDeal(id));
            }, 0);
          }

          return hasChanges ? updatedDeals : prevDeals;
        });
      }, 0);
      return () => clearTimeout(timeoutId);
    }, [getUpdatedDeal, clearUpdatedDeal, postAdded, setPostAdded]),
  );

  // ----- Pull-to-refresh ----------------------------------------------------
  const onRefresh = useCallback(async () => {
    const span = startPerfSpan('screen.feed.refresh', {
      hasCoordinates: Boolean(selectedCoordinates),
    });
    let spanClosed = false;
    let refreshedDealsCount = 0;

    setRefreshing(true);
    try {
      const freshDeals = await dealCacheService.getDeals(true, selectedCoordinates || undefined);
      refreshedDealsCount = freshDeals.length;
      span.recordRoundTrip({ source: 'dealCacheService.getDeals.force', deals: freshDeals.length });
      span.addPayload(freshDeals);
      setDeals(freshDeals);
    } catch (err) {
      console.error('Error refreshing deals:', err);
      span.end({ success: false, error: err });
      spanClosed = true;
    } finally {
      setRefreshing(false);
      if (!spanClosed) {
        span.end({ metadata: { dealsLoaded: refreshedDealsCount } });
      }
    }
  }, [selectedCoordinates]);

  // ----- Filtering ----------------------------------------------------------
  const filteredDeals = deals.filter((deal) => {
    if (selectedCuisineId === 'All') return true;
    return deal.cuisineId === selectedCuisineId;
  });

  const communityDeals = filteredDeals.slice(0, 10);
  const dealsForYou = filteredDeals;

  const cuisinesWithDeals = cuisines.filter((cuisine) =>
    deals.some((deal) => deal.cuisineId === cuisine.id),
  );

  // ----- Navigation ---------------------------------------------------------
  const handleDealPress = (dealId: string) => {
    const selectedDeal = deals.find((deal) => deal.id === dealId);
    if (selectedDeal) {
      const positionInFeed = filteredDeals.findIndex((d) => d.id === dealId);
      logClick(dealId, 'feed', positionInFeed >= 0 ? positionInFeed : undefined).catch((err) => {
        console.error('Failed to log click:', err);
      });
      (navigation as any).navigate('DealDetail', { deal: selectedDeal });
    }
  };

  // ----- Return context -----------------------------------------------------
  return {
    state: {
      deals,
      filteredDeals,
      loading,
      refreshing,
      error,
    },
    location: {
      isInitialLoad,
      isLocationLoading,
      hasLocationSet,
    },
    cuisineFilter: {
      selectedCuisineId,
      cuisinesWithDeals,
      cuisinesLoading,
      onFilterSelect: (filterName: string) => {
        const cuisine = cuisinesWithDeals.find((c) => c.name === filterName);
        setSelectedCuisineId(cuisine ? cuisine.id : 'All');
      },
    },
    interactions: {
      handleUpvote,
      handleDownvote,
      handleFavorite,
      handleDealPress,
    },
    communityDeals,
    dealsForYou,
    onRefresh,
    loadDeals,
  };
}
