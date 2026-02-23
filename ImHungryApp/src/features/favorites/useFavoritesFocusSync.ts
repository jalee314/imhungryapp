import { useFocusEffect } from '@react-navigation/native';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type React from 'react';
import { useCallback } from 'react';

import { supabase } from '../../../lib/supabase';
import { isFavoritesCacheStale } from '../../services/favoritesService';
import type { FavoriteDeal, FavoriteRestaurant } from '../../types/favorites';

import type { FavoritesTab } from './types';

interface NewlyFavoritedDeal {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  restaurantName: string;
  restaurantAddress: string;
  distance: string;
  favoritedAt: string;
  userId?: string;
  userDisplayName?: string;
  userProfilePhoto?: string | null;
  isAnonymous?: boolean;
}

interface UseFavoritesFocusSyncParams {
  activeTab: FavoritesTab;
  favoriteChannel: React.MutableRefObject<RealtimeChannel | null>;
  getNewlyFavoritedDeals: () => NewlyFavoritedDeal[];
  hasLoadedDeals: boolean;
  hasLoadedInitialData: boolean;
  hasLoadedRestaurants: boolean;
  isUnfavorited: (id: string, type: 'deal' | 'restaurant') => boolean;
  clearNewlyFavorited: () => void;
  loadDeals: (silent?: boolean, forceRefresh?: boolean) => Promise<void>;
  loadRestaurants: (silent?: boolean, forceRefresh?: boolean) => Promise<void>;
  needsDealsRefreshRef: React.MutableRefObject<boolean>;
  needsRestaurantsRefreshRef: React.MutableRefObject<boolean>;
  setDeals: React.Dispatch<React.SetStateAction<FavoriteDeal[]>>;
  setRestaurants: React.Dispatch<React.SetStateAction<FavoriteRestaurant[]>>;
  setupRealtimeSubscription: () => Promise<void>;
}

const mergeNewlyFavoritedDeals = (
  currentDeals: FavoriteDeal[],
  newlyFavoritedDeals: NewlyFavoritedDeal[],
): FavoriteDeal[] => {
  const existingIds = new Set(currentDeals.map((deal) => deal.id));
  const uniqueNewDeals = newlyFavoritedDeals
    .filter((deal) => !existingIds.has(deal.id))
    .map((deal) => ({
      id: deal.id,
      title: deal.title,
      description: deal.description,
      imageUrl: deal.imageUrl,
      restaurantName: deal.restaurantName,
      restaurantAddress: deal.restaurantAddress,
      distance: deal.distance,
      dealCount: 0,
      cuisineName: '',
      categoryName: '',
      createdAt: deal.favoritedAt,
      isFavorited: true,
      userId: deal.userId,
      userDisplayName: deal.userDisplayName,
      userProfilePhoto: deal.userProfilePhoto ?? null,
      isAnonymous: deal.isAnonymous || false,
    }))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  return [...uniqueNewDeals, ...currentDeals];
};

export const useFavoritesFocusSync = ({
  activeTab,
  favoriteChannel,
  getNewlyFavoritedDeals,
  hasLoadedDeals,
  hasLoadedInitialData,
  hasLoadedRestaurants,
  isUnfavorited,
  clearNewlyFavorited,
  loadDeals,
  loadRestaurants,
  needsDealsRefreshRef,
  needsRestaurantsRefreshRef,
  setDeals,
  setRestaurants,
  setupRealtimeSubscription,
}: UseFavoritesFocusSyncParams): void => {
  const syncFavoritesOnFocus = useCallback(() => {
    setupRealtimeSubscription();

    if (hasLoadedInitialData) {
      setDeals((previousDeals) => previousDeals.filter((deal) => !isUnfavorited(deal.id, 'deal')));
      setRestaurants((previousRestaurants) =>
        previousRestaurants.filter((restaurant) => !isUnfavorited(restaurant.id, 'restaurant')),
      );

      const newDeals = getNewlyFavoritedDeals();
      if (newDeals.length > 0) {
        setDeals((previousDeals) => mergeNewlyFavoritedDeals(previousDeals, newDeals));
      }
    }

    const silentRefreshIfNeeded = async () => {
      if (!hasLoadedInitialData) return;

      const dealsAreStale = hasLoadedDeals ? await isFavoritesCacheStale('deals') : false;
      const restaurantsAreStale = hasLoadedRestaurants
        ? await isFavoritesCacheStale('restaurants')
        : false;

      if (activeTab === 'deals' && (needsDealsRefreshRef.current || dealsAreStale)) {
        await loadDeals(true, true);
        needsDealsRefreshRef.current = false;
      }

      if (activeTab === 'restaurants' && (needsRestaurantsRefreshRef.current || restaurantsAreStale)) {
        await loadRestaurants(true, true);
        needsRestaurantsRefreshRef.current = false;
      }

      clearNewlyFavorited();
    };

    if (hasLoadedInitialData) {
      silentRefreshIfNeeded().catch((error) => {
        console.error('Error running favorites focus refresh:', error);
      });
    }

    return () => {
      if (favoriteChannel.current) {
        supabase.removeChannel(favoriteChannel.current);
      }
    };
  }, [
    activeTab,
    clearNewlyFavorited,
    favoriteChannel,
    getNewlyFavoritedDeals,
    hasLoadedDeals,
    hasLoadedInitialData,
    hasLoadedRestaurants,
    isUnfavorited,
    loadDeals,
    loadRestaurants,
    needsDealsRefreshRef,
    needsRestaurantsRefreshRef,
    setDeals,
    setRestaurants,
    setupRealtimeSubscription,
  ]);

  useFocusEffect(syncFavoritesOnFocus);
};
