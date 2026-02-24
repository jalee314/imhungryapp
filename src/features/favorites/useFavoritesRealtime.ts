import type { RealtimeChannel } from '@supabase/supabase-js';
import type React from 'react';
import { useCallback } from 'react';

import { supabase } from '../../../lib/supabase';
import { getCurrentUserId } from '../../services/currentUserService';
import { markFavoritesCacheDirty } from '../../services/favoritesService';
import type { FavoriteDeal, FavoriteRestaurant } from '../../types/favorites';

import type { FavoritesTab } from './types';

interface FavoriteInsertPayload {
  new?: {
    user_id?: string;
    deal_id?: string;
    restaurant_id?: string;
  };
}

interface FavoriteDeletePayload {
  old?: {
    user_id?: string;
    deal_id?: string;
    restaurant_id?: string;
  };
}

interface UseFavoritesRealtimeParams {
  favoriteChannel: React.MutableRefObject<RealtimeChannel | null>;
  needsDealsRefreshRef: React.MutableRefObject<boolean>;
  needsRestaurantsRefreshRef: React.MutableRefObject<boolean>;
  removeDealById: (dealId: string) => (deals: FavoriteDeal[]) => FavoriteDeal[];
  removeRestaurantById: (
    restaurantId: string,
  ) => (restaurants: FavoriteRestaurant[]) => FavoriteRestaurant[];
  scheduleSilentRevalidate: (target: FavoritesTab) => void;
  setDeals: React.Dispatch<React.SetStateAction<FavoriteDeal[]>>;
  setRestaurants: React.Dispatch<React.SetStateAction<FavoriteRestaurant[]>>;
}

export const useFavoritesRealtime = ({
  favoriteChannel,
  needsDealsRefreshRef,
  needsRestaurantsRefreshRef,
  removeDealById,
  removeRestaurantById,
  scheduleSilentRevalidate,
  setDeals,
  setRestaurants,
}: UseFavoritesRealtimeParams) => {
  const setupRealtimeSubscription = useCallback(async () => {
    try {
      if (favoriteChannel.current) {
        try {
          await supabase.removeChannel(favoriteChannel.current);
        } catch (error) {
          console.error('Error removing existing channel:', error);
        }
        favoriteChannel.current = null;
      }

      const userId = (await getCurrentUserId())?.trim() || '';
      if (!userId) return;

      const channel = supabase
        .channel(`favorites-realtime-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'favorite',
            filter: `user_id=eq.${userId}`,
          },
          (payload: FavoriteInsertPayload) => {
            const payloadUserId = payload.new?.user_id;
            if (payloadUserId !== userId) return;

            if (payload.new?.deal_id) {
              markFavoritesCacheDirty('deals');
              scheduleSilentRevalidate('deals');
            }

            if (payload.new?.restaurant_id) {
              markFavoritesCacheDirty('restaurants');
              scheduleSilentRevalidate('restaurants');
            }
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
          (payload: FavoriteDeletePayload) => {
            const oldFavorite = payload.old;
            const payloadUserId = oldFavorite?.user_id;
            if (payloadUserId !== userId || !oldFavorite) return;

            if (oldFavorite.deal_id) {
              setDeals(removeDealById(oldFavorite.deal_id));
              markFavoritesCacheDirty('deals');
              needsDealsRefreshRef.current = true;
            }

            if (oldFavorite.restaurant_id) {
              setRestaurants(removeRestaurantById(oldFavorite.restaurant_id));
              markFavoritesCacheDirty('restaurants');
              needsRestaurantsRefreshRef.current = true;
            }
          },
        )
        .subscribe();

      favoriteChannel.current = channel;
    } catch (error) {
      console.error('Error setting up favorites realtime subscription:', error);
    }
  }, [
    favoriteChannel,
    needsDealsRefreshRef,
    needsRestaurantsRefreshRef,
    removeDealById,
    removeRestaurantById,
    scheduleSilentRevalidate,
    setDeals,
    setRestaurants,
  ]);

  return {
    setupRealtimeSubscription,
  };
};
