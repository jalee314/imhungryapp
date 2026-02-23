/**
 * @file useFavoritesScreen — Headless hook that owns all Favorites state & side-effects.
 *
 * Extracted from the original FavoritesPage monolith so section components
 * can remain purely presentational.
 */

import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useState, useEffect, useRef, useCallback } from 'react';

import { supabase } from '../../../lib/supabase';
import { useFavorites } from '../../hooks/useFavorites';
import {
  markFavoritesCacheDirty,
  toggleRestaurantFavorite,
} from '../../services/favoritesService';
import { toggleFavorite } from '../../services/voteService';
import type { FavoriteDeal, FavoriteRestaurant } from '../../types/favorites';
import { startPerfSpan } from '../../utils/perfMonitor';

import {
  type FavoritesNavigationRoutes,
  useFavoritesNavigationHandlers,
} from './navigation';
import type { FavoritesTab, FavoritesContext } from './types';
import { useFavoritesDataLoaders } from './useFavoritesDataLoaders';
import { useFavoritesFocusSync } from './useFavoritesFocusSync';
import { useFavoritesRealtime } from './useFavoritesRealtime';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFavoritesScreen(): FavoritesContext {
  const navigation = useNavigation<NavigationProp<FavoritesNavigationRoutes>>();
  const {
    markAsUnfavorited,
    isUnfavorited,
    clearUnfavorited,
    clearNewlyFavorited,
    getNewlyFavoritedDeals,
  } = useFavorites();

  // ----- Core state ---------------------------------------------------------
  const [activeTab, setActiveTab] = useState<FavoritesTab>('deals');
  const [restaurants, setRestaurants] = useState<FavoriteRestaurant[]>([]);
  const [deals, setDeals] = useState<FavoriteDeal[]>([]);
  const [loading] = useState(false);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [unfavoritingIds, setUnfavoritingIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [hasLoadedDeals, setHasLoadedDeals] = useState(false);
  const [hasLoadedRestaurants, setHasLoadedRestaurants] = useState(false);

  // ----- Refs ---------------------------------------------------------------
  const favoriteChannel = useRef<RealtimeChannel | null>(null);
  const refreshDebounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const needsDealsRefreshRef = useRef(false);
  const needsRestaurantsRefreshRef = useRef(false);
  const previousTabRef = useRef<FavoritesTab>(activeTab);

  const removeDealById = useCallback(
    (dealId: string) => (previousDeals: FavoriteDeal[]) =>
      previousDeals.filter((deal) => deal.id !== dealId),
    [],
  );
  const removeRestaurantById = useCallback(
    (restaurantId: string) => (previousRestaurants: FavoriteRestaurant[]) =>
      previousRestaurants.filter((restaurant) => restaurant.id !== restaurantId),
    [],
  );

  // ----- Loaders / realtime / focus sync -----------------------------------
  const { loadDeals, loadRestaurants, scheduleSilentRevalidate } = useFavoritesDataLoaders({
    hasLoadedDeals,
    hasLoadedInitialData,
    hasLoadedRestaurants,
    setDeals,
    setDealsLoading,
    setHasLoadedDeals,
    setHasLoadedInitialData,
    setHasLoadedRestaurants,
    setRestaurants,
    setRestaurantsLoading,
    clearUnfavorited,
    isUnfavorited,
    needsDealsRefreshRef,
    needsRestaurantsRefreshRef,
    refreshDebounceTimeout,
  });

  const { setupRealtimeSubscription } = useFavoritesRealtime({
    favoriteChannel,
    needsDealsRefreshRef,
    needsRestaurantsRefreshRef,
    removeDealById,
    removeRestaurantById,
    scheduleSilentRevalidate,
    setDeals,
    setRestaurants,
  });

  const loadDealsRef = useRef(loadDeals);
  const loadRestaurantsRef = useRef(loadRestaurants);
  const setupRealtimeSubscriptionRef = useRef(setupRealtimeSubscription);
  const hasLoadedDealsRef = useRef(hasLoadedDeals);
  const hasLoadedRestaurantsRef = useRef(hasLoadedRestaurants);
  const dealsLoadingRef = useRef(dealsLoading);
  const restaurantsLoadingRef = useRef(restaurantsLoading);

  loadDealsRef.current = loadDeals;
  loadRestaurantsRef.current = loadRestaurants;
  setupRealtimeSubscriptionRef.current = setupRealtimeSubscription;
  hasLoadedDealsRef.current = hasLoadedDeals;
  hasLoadedRestaurantsRef.current = hasLoadedRestaurants;
  dealsLoadingRef.current = dealsLoading;
  restaurantsLoadingRef.current = restaurantsLoading;

  const clearRealtimeChannel = useCallback(() => {
    const channel = favoriteChannel.current;
    if (channel) {
      supabase.removeChannel(channel);
      favoriteChannel.current = null;
    }
  }, []);

  useEffect(() => {
    if (previousTabRef.current === 'restaurants') {
      loadRestaurantsRef.current().catch((error) => {
        console.error('Error loading initial restaurants favorites:', error);
      });
    } else {
      loadDealsRef.current().catch((error) => {
        console.error('Error loading initial deal favorites:', error);
      });
    }

    setupRealtimeSubscriptionRef.current();

    return () => {
      clearRealtimeChannel();
      if (refreshDebounceTimeout.current) {
        clearTimeout(refreshDebounceTimeout.current);
        refreshDebounceTimeout.current = null;
      }
    };
  }, [clearRealtimeChannel]);

  useEffect(() => {
    const previousTab = previousTabRef.current;
    const isTabSwitch = previousTab !== activeTab;
    const tabSwitchSpan = isTabSwitch
      ? startPerfSpan('screen.favorites.tab_switch', {
          from: previousTab,
          to: activeTab,
        })
      : null;

    const finishTabSwitch = (error?: unknown) => {
      if (!tabSwitchSpan) return;
      if (error) {
        tabSwitchSpan.end({ success: false, error, metadata: { to: activeTab } });
        return;
      }
      tabSwitchSpan.end({ metadata: { to: activeTab } });
    };

    const loadActiveTabData = async () => {
      if (activeTab === 'restaurants' && !restaurantsLoadingRef.current) {
        await loadRestaurantsRef.current(
          hasLoadedRestaurantsRef.current,
          needsRestaurantsRefreshRef.current,
        );
        needsRestaurantsRefreshRef.current = false;
        finishTabSwitch();
      } else if (activeTab === 'deals' && !dealsLoadingRef.current) {
        await loadDealsRef.current(hasLoadedDealsRef.current, needsDealsRefreshRef.current);
        needsDealsRefreshRef.current = false;
        finishTabSwitch();
      } else {
        finishTabSwitch();
      }
    };

    loadActiveTabData().catch((error) => {
      finishTabSwitch(error);
    });

    previousTabRef.current = activeTab;
  }, [activeTab]);

  useFavoritesFocusSync({
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
  });

  // ----- Pull-to-refresh ----------------------------------------------------
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'deals') {
        await loadDeals(false, true);
        needsDealsRefreshRef.current = false;
      } else {
        await loadRestaurants(false, true);
        needsRestaurantsRefreshRef.current = false;
      }
    } catch (error) {
      console.error('Error refreshing favorites:', error);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, loadDeals, loadRestaurants]);

  // ----- Navigation ---------------------------------------------------------
  const {
    handleRestaurantPress,
    handleDealPress,
    handleUserPress,
  } = useFavoritesNavigationHandlers({
    deals,
    restaurants,
    navigation,
  });

  // ----- Unfavorite ---------------------------------------------------------
  const handleUnfavorite = useCallback(
    async (id: string, type: 'restaurant' | 'deal') => {
      if (unfavoritingIds.has(id)) return;

      try {
        setUnfavoritingIds((previousIds) => new Set(previousIds).add(id));

        markAsUnfavorited(id, type);

        if (type === 'restaurant') {
          setRestaurants((previousRestaurants) => previousRestaurants.filter((restaurant) => restaurant.id !== id));
          const restaurant = restaurants.find((item) => item.id === id);
          if (restaurant) {
            setDeals((previousDeals) =>
              previousDeals.filter((deal) => deal.restaurantName !== restaurant.name),
            );
          }
          needsRestaurantsRefreshRef.current = true;
          markFavoritesCacheDirty('restaurants');
          scheduleSilentRevalidate('restaurants');
        } else {
          setDeals((previousDeals) => previousDeals.filter((deal) => deal.id !== id));
          needsDealsRefreshRef.current = true;
          markFavoritesCacheDirty('deals');
          scheduleSilentRevalidate('deals');
        }

        if (type === 'restaurant') {
          toggleRestaurantFavorite(id, true).catch((error) => {
            console.error('Failed to unfavorite restaurant:', error);
          });
        } else {
          toggleFavorite(id, true).catch((error) => {
            console.error('Failed to unfavorite deal:', error);
          });
        }
      } catch (error) {
        console.error('Error unfavoriting:', error);
      } finally {
        setUnfavoritingIds((previousIds) => {
          const nextIds = new Set(previousIds);
          nextIds.delete(id);
          return nextIds;
        });
      }
    },
    [markAsUnfavorited, restaurants, scheduleSilentRevalidate, unfavoritingIds],
  );

  return {
    state: {
      activeTab,
      restaurants,
      deals,
      loading,
      restaurantsLoading,
      dealsLoading,
      refreshing,
      hasLoadedDeals,
      hasLoadedRestaurants,
    },
    interactions: {
      setActiveTab,
      handleRestaurantPress,
      handleDealPress,
      handleUserPress,
      handleUnfavorite,
      handleRefresh,
    },
  };
}
