/**
 * @file useFeed — Headless hook that owns all Feed state & side-effects.
 *
 * Extracted from the original Feed screen monolith so section
 * components can remain purely presentational.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import React from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Deal } from '../../components/DealCard';
import { calculateVoteCounts } from '../../services/voteService';
import { supabase } from '../../../lib/supabase';
import { logClick } from '../../services/interactionService';
import { dealCacheService } from '../../services/dealCacheService';
import { useDealUpdate } from '../../hooks/useDealUpdate';
import { useDataCache } from '../../hooks/useDataCache';
import { useLocation } from '../../context/LocationContext';
import { useFeedInteractionHandlers } from '../../hooks/useFeedInteractionHandlers';
import type { FeedContext } from './types';

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
      console.error('Error loading deals:', err);
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
          async (payload: any) => {
            const interaction = payload.new || payload.old;
            if (interaction.interaction_type === 'click') return;
            if (interaction.user_id === userId) return;

            const actionKey = `${interaction.deal_id}-${interaction.interaction_type}`;
            if (recentActions.current.has(actionKey)) return;

            recentActions.current.add(actionKey);
            setTimeout(() => recentActions.current.delete(actionKey), 1000);

            const changedDealId = interaction.deal_id;
            const voteCounts = await calculateVoteCounts([changedDealId]);

            setDeals(prevDeals => prevDeals.map(deal => {
              if (deal.id === changedDealId) {
                return {
                  ...deal,
                  votes: voteCounts[changedDealId] ?? deal.votes,
                };
              }
              return deal;
            }));
          },
        )
        .subscribe();

      favoriteChannel.current = supabase
        .channel('user-favorites')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'favorite', filter: `user_id=eq.${userId}` },
          (payload: any) => {
            const dealId = payload.new?.deal_id || payload.old?.deal_id;
            const isFavorited = payload.eventType === 'INSERT';
            setTimeout(() => {
              setDeals(prevDeals => prevDeals.map(deal =>
                deal.id === dealId ? { ...deal, isFavorited } : deal,
              ));
            }, 0);
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
          setDeals(prevDeals => {
            const hasChanges = cachedDeals.some((cachedDeal) => {
              const currentDeal = prevDeals.find(d => d.id === cachedDeal.id);
              if (!currentDeal) return true;

              if (cachedDeal.isAnonymous !== currentDeal.isAnonymous) return true;
              if (cachedDeal.author !== currentDeal.author) return true;
              if (cachedDeal.title !== currentDeal.title) return true;
              if (cachedDeal.details !== currentDeal.details) return true;

              const cachedVariants = cachedDeal.imageVariants;
              const currentVariants = currentDeal.imageVariants;
              if (!cachedVariants && !currentVariants) return false;
              if (!cachedVariants || !currentVariants) return true;
              return cachedVariants.medium !== currentVariants.medium ||
                cachedVariants.small !== currentVariants.small ||
                cachedVariants.thumbnail !== currentVariants.thumbnail;
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
        setDeals(prevDeals => {
          let hasChanges = false;
          const dealIdsToClear: string[] = [];
          const updatedDeals = prevDeals.map(deal => {
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
              dealIdsToClear.forEach(id => clearUpdatedDeal(id));
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
      console.error('Error refreshing deals:', err);
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
