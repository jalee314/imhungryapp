/**
 * @file useFavoritesScreen — Headless hook that owns all Favorites state & side-effects.
 *
 * Extracted from the original FavoritesPage monolith so section components
 * can remain purely presentational.
 */

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { supabase } from '../../../lib/supabase';
import { useFavorites } from '../../hooks/useFavorites';
import { getCurrentUserId } from '../../services/currentUserService';
import {
  fetchFavoriteDeals,
  fetchFavoriteRestaurants,
  isFavoritesCacheStale,
  markFavoritesCacheDirty,
  toggleRestaurantFavorite,
} from '../../services/favoritesService';
import { toggleFavorite } from '../../services/voteService';
import type { FavoriteDeal, FavoriteRestaurant } from '../../types/favorites';
import { startPerfSpan } from '../../utils/perfMonitor';

import type { FavoritesTab, FavoritesContext } from './types';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFavoritesScreen(): FavoritesContext {
  const navigation = useNavigation();
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
  const favoriteChannel = useRef<any>(null);
  const refreshDebounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const needsDealsRefreshRef = useRef(false);
  const needsRestaurantsRefreshRef = useRef(false);
  const previousTabRef = useRef<FavoritesTab>(activeTab);

  // ----- Data loaders -------------------------------------------------------

  const loadRestaurants = useCallback(
    async (silent: boolean = false, forceRefresh: boolean = false) => {
      const span = startPerfSpan('screen.favorites.load.restaurants', {
        silent,
        forceRefresh,
        hasLoadedRestaurants,
      });
      let spanClosed = false;
      let loadedCount = 0;

      try {
        if (!silent && !hasLoadedRestaurants) {
          setRestaurantsLoading(true);
        }
        if (!hasLoadedInitialData) {
          clearUnfavorited();
          setHasLoadedInitialData(true);
        }

        const restaurantsData = await fetchFavoriteRestaurants({ forceRefresh });
        span.recordRoundTrip({
          source: 'favoritesService.fetchFavoriteRestaurants',
          count: restaurantsData.length,
          forceRefresh,
        });

        const filteredData = restaurantsData.filter(
          (restaurant) => !isUnfavorited(restaurant.id, 'restaurant'),
        );
        loadedCount = filteredData.length;
        span.addPayload(filteredData);
        setRestaurants(filteredData);
        setHasLoadedRestaurants(true);
      } catch (error) {
        console.error('Error loading restaurants:', error);
        span.end({ success: false, error });
        spanClosed = true;
      } finally {
        if (!silent && !hasLoadedRestaurants) {
          setRestaurantsLoading(false);
        }
        if (!spanClosed) {
          span.end({
            metadata: {
              loadedCount,
              silent,
              forceRefresh,
            },
          });
        }
      }
    },
    [hasLoadedRestaurants, hasLoadedInitialData, clearUnfavorited, isUnfavorited],
  );

  const loadDeals = useCallback(
    async (silent: boolean = false, forceRefresh: boolean = false) => {
      const span = startPerfSpan('screen.favorites.load.deals', {
        silent,
        forceRefresh,
        hasLoadedDeals,
      });
      let spanClosed = false;
      let loadedCount = 0;

      try {
        if (!silent && !hasLoadedDeals) {
          setDealsLoading(true);
        }
        if (!hasLoadedInitialData) {
          clearUnfavorited();
          setHasLoadedInitialData(true);
        }

        const dealsData = await fetchFavoriteDeals({ forceRefresh });
        span.recordRoundTrip({
          source: 'favoritesService.fetchFavoriteDeals',
          count: dealsData.length,
          forceRefresh,
        });

        const filteredData = dealsData.filter((deal) => !isUnfavorited(deal.id, 'deal'));
        loadedCount = filteredData.length;
        span.addPayload(filteredData);
        setDeals(filteredData);
        setHasLoadedDeals(true);
      } catch (error) {
        console.error('Error loading deals:', error);
        span.end({ success: false, error });
        spanClosed = true;
      } finally {
        if (!silent && !hasLoadedDeals) {
          setDealsLoading(false);
        }
        if (!spanClosed) {
          span.end({
            metadata: {
              loadedCount,
              silent,
              forceRefresh,
            },
          });
        }
      }
    },
    [hasLoadedDeals, hasLoadedInitialData, clearUnfavorited, isUnfavorited],
  );

  const scheduleSilentRevalidate = useCallback(
    (target: FavoritesTab) => {
      if (target === 'deals') {
        needsDealsRefreshRef.current = true;
      } else {
        needsRestaurantsRefreshRef.current = true;
      }

      if (refreshDebounceTimeout.current) {
        clearTimeout(refreshDebounceTimeout.current);
      }

      refreshDebounceTimeout.current = setTimeout(() => {
        const runRevalidate = async () => {
          if (needsDealsRefreshRef.current && hasLoadedDeals) {
            await loadDeals(true, true);
            needsDealsRefreshRef.current = false;
          }

          if (needsRestaurantsRefreshRef.current && hasLoadedRestaurants) {
            await loadRestaurants(true, true);
            needsRestaurantsRefreshRef.current = false;
          }
        };

        runRevalidate().catch((error) => {
          console.error('Error in debounced favorites revalidation:', error);
        });
      }, 700);
    },
    [hasLoadedDeals, hasLoadedRestaurants, loadDeals, loadRestaurants],
  );

  // ----- Realtime -----------------------------------------------------------

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
          (payload: { new?: { user_id?: string; deal_id?: string; restaurant_id?: string } }) => {
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
          (payload: { old?: { user_id?: string; deal_id?: string; restaurant_id?: string } }) => {
            const oldFavorite = payload.old;
            const payloadUserId = oldFavorite?.user_id;
            if (payloadUserId !== userId || !oldFavorite) return;

            if (oldFavorite.deal_id) {
              setDeals((prev) => prev.filter((deal) => deal.id !== oldFavorite.deal_id));
              markFavoritesCacheDirty('deals');
              needsDealsRefreshRef.current = true;
            }

            if (oldFavorite.restaurant_id) {
              setRestaurants((prev) => prev.filter((r) => r.id !== oldFavorite.restaurant_id));
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
  }, [scheduleSilentRevalidate]);

  // ----- Initial load -------------------------------------------------------

  useEffect(() => {
    if (activeTab === 'restaurants') {
      loadRestaurants();
    } else {
      loadDeals();
    }

    setupRealtimeSubscription();

    return () => {
      if (favoriteChannel.current) {
        supabase.removeChannel(favoriteChannel.current);
      }
      if (refreshDebounceTimeout.current) {
        clearTimeout(refreshDebounceTimeout.current);
        refreshDebounceTimeout.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Tab change ---------------------------------------------------------

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
      if (activeTab === 'restaurants' && !restaurantsLoading) {
        await loadRestaurants(hasLoadedRestaurants, needsRestaurantsRefreshRef.current);
        needsRestaurantsRefreshRef.current = false;
        finishTabSwitch();
      } else if (activeTab === 'deals' && !dealsLoading) {
        await loadDeals(hasLoadedDeals, needsDealsRefreshRef.current);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ----- Focus sync ---------------------------------------------------------

  useFocusEffect(
    React.useCallback(() => {
      setupRealtimeSubscription();

      if (hasLoadedInitialData) {
        setDeals((prev) => prev.filter((deal) => !isUnfavorited(deal.id, 'deal')));
        setRestaurants((prev) =>
          prev.filter((restaurant) => !isUnfavorited(restaurant.id, 'restaurant')),
        );

        const newDeals = getNewlyFavoritedDeals();
        if (newDeals.length > 0) {
          setDeals((prev) => {
            const existingIds = new Set(prev.map((d) => d.id));
            const uniqueNewDeals = newDeals
              .filter((d) => !existingIds.has(d.id))
              .map((d) => ({
                id: d.id,
                title: d.title,
                description: d.description,
                imageUrl: d.imageUrl,
                restaurantName: d.restaurantName,
                restaurantAddress: d.restaurantAddress,
                distance: d.distance,
                dealCount: 0,
                cuisineName: '',
                categoryName: '',
                createdAt: d.favoritedAt,
                isFavorited: true,
                userId: d.userId,
                userDisplayName: d.userDisplayName,
                userProfilePhoto: d.userProfilePhoto,
                isAnonymous: d.isAnonymous || false,
              }))
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
              );
            return [...uniqueNewDeals, ...prev];
          });
        }
      }

      const silentRefreshIfNeeded = async () => {
        if (!hasLoadedInitialData) return;

        const dealsAreStale = hasLoadedDeals
          ? await isFavoritesCacheStale('deals')
          : false;
        const restaurantsAreStale = hasLoadedRestaurants
          ? await isFavoritesCacheStale('restaurants')
          : false;

        if (activeTab === 'deals' && (needsDealsRefreshRef.current || dealsAreStale)) {
          await loadDeals(true, true);
          needsDealsRefreshRef.current = false;
        }

        if (
          activeTab === 'restaurants' &&
          (needsRestaurantsRefreshRef.current || restaurantsAreStale)
        ) {
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
      getNewlyFavoritedDeals,
      hasLoadedDeals,
      hasLoadedInitialData,
      hasLoadedRestaurants,
      isUnfavorited,
      loadDeals,
      loadRestaurants,
      setupRealtimeSubscription,
    ]),
  );

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

  const handleRestaurantPress = useCallback(
    (restaurantId: string) => {
      const restaurant = restaurants.find((r) => r.id === restaurantId);
      if (restaurant) {
        const restaurantForDetail = {
          restaurant_id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
          logo_image: restaurant.imageUrl,
          deal_count: restaurant.dealCount,
          distance_miles:
            parseFloat(restaurant.distance.replace('mi', '').replace('m', '')) || 0,
          lat: 0,
          lng: 0,
        };
        (navigation as any).navigate('RestaurantDetail', {
          restaurant: restaurantForDetail,
        });
      }
    },
    [restaurants, navigation],
  );

  const handleDealPress = useCallback(
    (dealId: string) => {
      const deal = deals.find((d) => d.id === dealId);
      if (deal) {
        const dealForDetail = {
          id: deal.id,
          title: deal.title,
          restaurant: deal.restaurantName,
          details: deal.description,
          image: deal.imageUrl
            ? { uri: deal.imageUrl }
            : require('../../../img/default-rest.png'),
          imageVariants: deal.imageVariants,
          votes: 0,
          isUpvoted: false,
          isDownvoted: false,
          isFavorited: true,
          cuisine: deal.cuisineName,
          cuisineId: undefined,
          timeAgo: 'Unknown',
          author: deal.userDisplayName || 'Unknown',
          milesAway: deal.distance,
          userId: deal.userId,
          userDisplayName: deal.userDisplayName,
          userProfilePhoto: deal.userProfilePhoto,
          restaurantAddress: deal.restaurantAddress,
          isAnonymous: deal.isAnonymous,
        };
        (navigation as any).navigate('DealDetail', { deal: dealForDetail });
      }
    },
    [deals, navigation],
  );

  const handleUserPress = useCallback(
    (userId: string) => {
      const deal = deals.find((d) => d.userId === userId);
      if (deal && deal.userDisplayName) {
        (navigation as any).navigate('UserProfile', {
          viewUser: true,
          username: deal.userDisplayName,
          userId,
        });
      }
    },
    [deals, navigation],
  );

  // ----- Unfavorite ---------------------------------------------------------

  const handleUnfavorite = useCallback(
    async (id: string, type: 'restaurant' | 'deal') => {
      if (unfavoritingIds.has(id)) return;

      try {
        setUnfavoritingIds((prev) => new Set(prev).add(id));

        markAsUnfavorited(id, type);

        if (type === 'restaurant') {
          setRestaurants((prev) => prev.filter((r) => r.id !== id));
          const restaurant = restaurants.find((r) => r.id === id);
          if (restaurant) {
            setDeals((prev) => prev.filter((d) => d.restaurantName !== restaurant.name));
          }
          needsRestaurantsRefreshRef.current = true;
          markFavoritesCacheDirty('restaurants');
          scheduleSilentRevalidate('restaurants');
        } else {
          setDeals((prev) => prev.filter((d) => d.id !== id));
          needsDealsRefreshRef.current = true;
          markFavoritesCacheDirty('deals');
          scheduleSilentRevalidate('deals');
        }

        if (type === 'restaurant') {
          toggleRestaurantFavorite(id, true).catch((err) => {
            console.error('Failed to unfavorite restaurant:', err);
          });
        } else {
          toggleFavorite(id, true).catch((err) => {
            console.error('Failed to unfavorite deal:', err);
          });
        }
      } catch (error) {
        console.error('Error unfavoriting:', error);
      } finally {
        setUnfavoritingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    },
    [
      markAsUnfavorited,
      restaurants,
      scheduleSilentRevalidate,
      unfavoritingIds,
    ],
  );

  // ----- Return context -----------------------------------------------------
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
