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
import { dealCacheService } from '../../services/dealCacheService';
import { logClick } from '../../services/interactionService';
import { calculateVoteCounts } from '../../services/voteService';
import type { Deal } from '../../types/deal';
import { logger } from '../../utils/logger';

import type { FeedContext } from './types';

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

const applyVoteCountUpdate = (
  deals: Deal[],
  changedDealId: string,
  voteCounts: Record<string, number>,
): Deal[] =>
  deals.map((deal) => (
    deal.id === changedDealId
      ? { ...deal, votes: voteCounts[changedDealId] ?? deal.votes }
      : deal
  ));

const applyFavoriteRealtimeUpdate = (
  deals: Deal[],
  dealId: string | undefined,
  isFavorited: boolean,
): Deal[] => {
  if (!dealId) return deals;
  return deals.map((deal) => (
    deal.id === dealId ? { ...deal, isFavorited } : deal
  ));
};

const scheduleFavoriteRealtimeUpdate = (
  setDeals: React.Dispatch<React.SetStateAction<Deal[]>>,
  dealId: string | undefined,
  isFavorited: boolean,
) => {
  setTimeout(() => {
    setDeals((prevDeals) => applyFavoriteRealtimeUpdate(prevDeals, dealId, isFavorited));
  }, 0);
};

const hasVariantDifference = (
  cachedVariants: Deal['imageVariants'],
  currentVariants: Deal['imageVariants'],
): boolean => {
  if (!cachedVariants && !currentVariants) return false;
  if (!cachedVariants || !currentVariants) return true;
  return cachedVariants.medium !== currentVariants.medium
    || cachedVariants.small !== currentVariants.small
    || cachedVariants.thumbnail !== currentVariants.thumbnail;
};

const shouldSyncFromCache = (
  cachedDeals: Deal[],
  prevDeals: Deal[],
): boolean => {
  if (cachedDeals.length !== prevDeals.length) return true;

  const prevDealsById = new Map(prevDeals.map((deal) => [deal.id, deal] as const));
  for (const cachedDeal of cachedDeals) {
    const currentDeal = prevDealsById.get(cachedDeal.id);
    if (!currentDeal) return true;
    if (cachedDeal.isAnonymous !== currentDeal.isAnonymous) return true;
    if (cachedDeal.author !== currentDeal.author) return true;
    if (cachedDeal.title !== currentDeal.title) return true;
    if (cachedDeal.details !== currentDeal.details) return true;
    if (hasVariantDifference(cachedDeal.imageVariants, currentDeal.imageVariants)) return true;
  }

  return false;
};

const applyUpdatedDeals = (
  prevDeals: Deal[],
  getUpdatedDeal: (dealId: string) => Deal | undefined,
) => {
  let hasChanges = false;
  const dealIdsToClear: string[] = [];

  const updatedDeals = prevDeals.map((deal) => {
    const updatedDeal = getUpdatedDeal(deal.id);
    if (!updatedDeal) return deal;
    hasChanges = true;
    dealIdsToClear.push(deal.id);
    return updatedDeal;
  });

  return { hasChanges, dealIdsToClear, updatedDeals };
};

const clearDealUpdates = (
  dealIdsToClear: string[],
  clearUpdatedDeal: (dealId: string) => void,
) => {
  for (const dealId of dealIdsToClear) {
    clearUpdatedDeal(dealId);
  }
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
    try {
      if (deals.length === 0) setLoading(true);
      const cachedDeals = await dealCacheService.getDeals(false, selectedCoordinates || undefined);
      setDeals(cachedDeals);
      setError(null);
    } catch (err) {
      logger.error('Error loading deals:', err);
      setError('Failed to load deals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [deals.length, selectedCoordinates]);

  // Location-driven deal loading
  useEffect(() => {
    if (isInitialLoad) return;

    if (hasLocationSet) {
      loadDeals();
      dealCacheService.initializeRealtime();
      const unsubscribe = dealCacheService.subscribe((updatedDeals) => {
        setTimeout(() => setDeals(updatedDeals), 0);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCoordinates, hasLocationSet, isInitialLoad]);

  // ----- Realtime subscriptions ---------------------------------------------
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userId = user.id;

      if (interactionChannel.current) {
        supabase.removeChannel(interactionChannel.current);
        interactionChannel.current = null;
      }
      if (favoriteChannel.current) {
        supabase.removeChannel(favoriteChannel.current);
        favoriteChannel.current = null;
      }

      interactionChannel.current = supabase
        .channel('all-interactions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'interaction' },
          async (payload) => {
            const interaction = payload.new || payload.old;
            if (interaction.interaction_type === 'click') return;
            if (interaction.user_id === userId) return;

            const actionKey = `${interaction.deal_id}-${interaction.interaction_type}`;
            if (recentActions.current.has(actionKey)) return;

            recentActions.current.add(actionKey);
            setTimeout(() => recentActions.current.delete(actionKey), 1000);

            const changedDealId = interaction.deal_id;
            const voteCounts = await calculateVoteCounts([changedDealId]);

            setDeals((prevDeals) => applyVoteCountUpdate(prevDeals, changedDealId, voteCounts));
          },
        )
        .subscribe();

      favoriteChannel.current = supabase
        .channel('user-favorites')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'favorite', filter: `user_id=eq.${userId}` },
          (payload) => {
            const dealId = payload.new?.deal_id || payload.old?.deal_id;
            const isFavorited = payload.eventType === 'INSERT';
            scheduleFavoriteRealtimeUpdate(setDeals, dealId, isFavorited);
          },
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (interactionChannel.current) supabase.removeChannel(interactionChannel.current);
      if (favoriteChannel.current) supabase.removeChannel(favoriteChannel.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      recentActions.current.clear();
    };
  }, []);

  // ----- Focus sync ---------------------------------------------------------
  useFocusEffect(
    React.useCallback(() => {
      const syncWithCache = async () => {
        if (postAdded) {
          logger.info('📸 Feed: postAdded detected, syncing with fresh cache');
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
            if (shouldSyncFromCache(cachedDeals, prevDeals)) {
              logger.info('📸 Feed: Detected deal changes, syncing with cache');
              return cachedDeals;
            }
            return prevDeals;
          });
        }
      };
      syncWithCache();

      const timeoutId = setTimeout(() => {
        setDeals((prevDeals) => {
          const { hasChanges, dealIdsToClear, updatedDeals } = applyUpdatedDeals(prevDeals, getUpdatedDeal);

          if (hasChanges) {
            setTimeout(() => {
              clearDealUpdates(dealIdsToClear, clearUpdatedDeal);
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
    setRefreshing(true);
    try {
      const freshDeals = await dealCacheService.getDeals(true);
      setTimeout(() => setDeals(freshDeals), 0);
    } catch (err) {
      logger.error('Error refreshing deals:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ----- Filtering ----------------------------------------------------------
  const filteredDeals = deals.filter(deal => {
    if (selectedCuisineId === 'All') return true;
    return deal.cuisineId === selectedCuisineId;
  });

  const communityDeals = filteredDeals.slice(0, 10);
  const dealsForYou = filteredDeals;

  const cuisinesWithDeals = cuisines.filter(cuisine =>
    deals.some(deal => deal.cuisineId === cuisine.id),
  );

  // ----- Navigation ---------------------------------------------------------
  const handleDealPress = (dealId: string) => {
    const selectedDeal = deals.find(deal => deal.id === dealId);
    if (selectedDeal) {
      const positionInFeed = filteredDeals.findIndex(d => d.id === dealId);
      logClick(dealId, 'feed', positionInFeed >= 0 ? positionInFeed : undefined).catch(err => {
        logger.error('Failed to log click:', err);
      });
      (navigation).navigate('DealDetail', { deal: selectedDeal });
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
        const cuisine = cuisinesWithDeals.find(c => c.name === filterName);
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
