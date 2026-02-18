/**
 * @file useCommunity — Headless hook that owns all Community (Featured Deals) state & side-effects.
 *
 * Extracted from the original CommunityUploadedScreen monolith so section
 * components can remain purely presentational.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import React from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { Deal } from '../../types/deal';
import { getUserVoteStates, calculateVoteCounts } from '../../services/voteService';
import { logClick } from '../../services/interactionService';
import { dealCacheService } from '../../services/dealCacheService';
import { supabase } from '../../../lib/supabase';
import { useDealUpdate } from '../../hooks/useDealUpdate';
import { useFeedInteractionHandlers } from '../../hooks/useFeedInteractionHandlers';
import type { CommunityContext } from './types';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCommunity(): CommunityContext {
  const navigation = useNavigation();
  const { getUpdatedDeal, clearUpdatedDeal } = useDealUpdate();

  // ----- Core state ---------------------------------------------------------
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const interactionChannel = useRef<RealtimeChannel | null>(null);
  const favoriteChannel = useRef<RealtimeChannel | null>(null);
  const recentActions = useRef<Set<string>>(new Set());
  const currentUserId = useRef<string | null>(null);

  // Interaction handlers (optimistic updates)
  const { handleUpvote, handleDownvote, handleFavorite } = useFeedInteractionHandlers({
    deals,
    setDeals,
  });

  // ----- Initial load + cache subscription ----------------------------------
  useEffect(() => {
    const loadDeals = async () => {
      try {
        setLoading(true);
        const cachedDeals = await dealCacheService.getDeals();
        setDeals(cachedDeals);
        setError(null);
      } catch (err) {
        console.error('Error loading deals:', err);
        setError('Failed to load deals. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadDeals();

    const unsubscribe = dealCacheService.subscribe((updatedDeals) => {
      setDeals(updatedDeals);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // ----- Focus sync ---------------------------------------------------------
  useFocusEffect(
    React.useCallback(() => {
      const timeoutId = setTimeout(() => {
        const dealsToClean: string[] = [];

        setDeals(prevDeals => {
          let hasChanges = false;
          const updatedDeals = prevDeals.map(deal => {
            const updatedDeal = getUpdatedDeal(deal.id);
            if (updatedDeal) {
              hasChanges = true;
              dealsToClean.push(deal.id);
              return updatedDeal;
            }
            return deal;
          });

          return hasChanges ? updatedDeals : prevDeals;
        });

        if (dealsToClean.length > 0) {
          setTimeout(() => {
            dealsToClean.forEach(id => clearUpdatedDeal(id));
          }, 0);
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    }, [getUpdatedDeal, clearUpdatedDeal]),
  );

  // ----- Realtime subscriptions ---------------------------------------------
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userId = user.id;
      currentUserId.current = userId;

      if (interactionChannel.current) {
        supabase.removeChannel(interactionChannel.current);
        interactionChannel.current = null;
      }
      if (favoriteChannel.current) {
        supabase.removeChannel(favoriteChannel.current);
        favoriteChannel.current = null;
      }

      interactionChannel.current = supabase
        .channel('community-interactions')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'interaction',
          },
          async (payload) => {
            const interaction = payload.new;
            if (interaction.interaction_type === 'click') return;
            if (interaction.user_id === userId) {
              console.log('⏭️ Skipping own action - optimistic update already handled it');
              return;
            }

            const actionKey = `${interaction.deal_id}-${interaction.interaction_type}`;
            if (recentActions.current.has(actionKey)) return;

            recentActions.current.add(actionKey);
            setTimeout(() => recentActions.current.delete(actionKey), 1000);

            console.log('⚡ Realtime interaction from another user:', interaction.interaction_type);

            const [voteStates, voteCounts] = await Promise.all([
              getUserVoteStates([interaction.deal_id]),
              calculateVoteCounts([interaction.deal_id]),
            ]);

            setDeals(prevDeals => prevDeals.map(deal => {
              if (deal.id === interaction.deal_id) {
                return {
                  ...deal,
                  votes: voteCounts[deal.id] || deal.votes,
                  isUpvoted: deal.isUpvoted,
                  isDownvoted: deal.isDownvoted,
                };
              }
              return deal;
            }));
          },
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('📡 Community Interaction channel: SUBSCRIBED');
          }
        });

      favoriteChannel.current = supabase
        .channel('community-favorites')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'favorite',
            filter: `user_id=eq.${userId}`,
          },
          (payload: any) => {
            const dealId = payload.new?.deal_id || payload.old?.deal_id;

            const actionKey = `favorite-${dealId}`;
            if (recentActions.current.has(actionKey)) {
              console.log('⏭️ Skipping duplicate favorite event');
              return;
            }

            const isFavorited = payload.eventType === 'INSERT';
            console.log('⚡ Realtime favorite:', payload.eventType, dealId);

            setDeals(prevDeals => prevDeals.map(deal =>
              deal.id === dealId ? { ...deal, isFavorited } : deal,
            ));
          },
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('📡 Community Favorite channel: SUBSCRIBED');
          }
        });
    };

    setupRealtimeSubscription();

    return () => {
      if (interactionChannel.current) {
        supabase.removeChannel(interactionChannel.current);
      }
      if (favoriteChannel.current) {
        supabase.removeChannel(favoriteChannel.current);
      }
      recentActions.current.clear();
    };
  }, []);

  // ----- Pull-to-refresh ----------------------------------------------------
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const freshDeals = await dealCacheService.getDeals(true);
      setDeals(freshDeals);
    } catch (err) {
      console.error('Error refreshing deals:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ----- Navigation ---------------------------------------------------------
  const handleDealPress = (dealId: string) => {
    const selectedDeal = deals.find(deal => deal.id === dealId);
    if (selectedDeal) {
      const positionInFeed = deals.findIndex(d => d.id === dealId);
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
      loading,
      refreshing,
      error,
    },
    interactions: {
      handleUpvote,
      handleDownvote,
      handleFavorite,
      handleDealPress,
    },
    onRefresh,
    goBack: () => navigation.goBack(),
  };
}
