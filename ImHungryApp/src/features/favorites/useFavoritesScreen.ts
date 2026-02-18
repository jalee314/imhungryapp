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
import type { FavoriteDeal, FavoriteRestaurant } from '../../types/favorites';
import {
  fetchFavoriteDeals,
  fetchFavoriteRestaurants,
  clearFavoritesCache,
  toggleRestaurantFavorite,
} from '../../services/favoritesService';
import { toggleFavorite } from '../../services/voteService';

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
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const [realtimeEnabled] = useState(true);

  // ----- Data loaders -------------------------------------------------------

  const loadRestaurants = useCallback(
    async (silent: boolean = false) => {
      try {
        if (!silent && !hasLoadedRestaurants) {
          setRestaurantsLoading(true);
        }
        if (!hasLoadedInitialData) {
          clearUnfavorited();
          setHasLoadedInitialData(true);
        }
        const restaurantsData = await fetchFavoriteRestaurants();
        const filteredData = restaurantsData.filter(
          (restaurant) => !isUnfavorited(restaurant.id, 'restaurant'),
        );
        setRestaurants(filteredData);
        setHasLoadedRestaurants(true);
      } catch (error) {
        console.error('Error loading restaurants:', error);
      } finally {
        if (!silent && !hasLoadedRestaurants) {
          setRestaurantsLoading(false);
        }
      }
    },
    [hasLoadedRestaurants, hasLoadedInitialData, clearUnfavorited, isUnfavorited],
  );

  const loadDeals = useCallback(
    async (silent: boolean = false) => {
      try {
        if (!silent && !hasLoadedDeals) {
          setDealsLoading(true);
        }
        if (!hasLoadedInitialData) {
          clearUnfavorited();
          setHasLoadedInitialData(true);
        }
        const dealsData = await fetchFavoriteDeals();
        const filteredData = dealsData.filter(
          (deal) => !isUnfavorited(deal.id, 'deal'),
        );
        setDeals(filteredData);
        setHasLoadedDeals(true);
      } catch (error) {
        console.error('Error loading deals:', error);
      } finally {
        if (!silent && !hasLoadedDeals) {
          setDealsLoading(false);
        }
      }
    },
    [hasLoadedDeals, hasLoadedInitialData, clearUnfavorited, isUnfavorited],
  );

  // ----- Realtime -----------------------------------------------------------

  const setupRealtimeSubscription = useCallback(async () => {
    try {
      if (!realtimeEnabled) return;

      if (favoriteChannel.current) {
        try {
          await supabase.removeChannel(favoriteChannel.current);
        } catch (error) {
          console.error('Error removing existing channel:', error);
        }
        favoriteChannel.current = null;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !user.id) return;

      const userId = user.id.trim();
      if (!userId) return;

      const channel = supabase
        .channel(`favorites-realtime-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'favorite',
            filter: `user_id=eq.${userId}`,
          },
          (payload: any) => {
            const payloadUserId =
              payload.new?.user_id || payload.old?.user_id;
            if (payloadUserId !== userId) return;

            if (payload.eventType === 'DELETE') {
              const oldFavorite = payload.old;
              if (oldFavorite.deal_id) {
                setDeals((prev) =>
                  prev.filter((deal) => deal.id !== oldFavorite.deal_id),
                );
              } else if (oldFavorite.restaurant_id) {
                setRestaurants((prev) =>
                  prev.filter((r) => r.id !== oldFavorite.restaurant_id),
                );
              }
            } else if (payload.eventType === 'INSERT') {
              if (activeTab === 'deals') {
                loadDeals();
              } else {
                loadRestaurants();
              }
            }
          },
        )
        .subscribe((status: any) => {
          if (status === 'SUBSCRIBED') {
            if (refreshInterval.current) {
              clearInterval(refreshInterval.current);
              refreshInterval.current = null;
            }
          }
        });

      favoriteChannel.current = channel;
    } catch (error) {
      console.error(
        'Error setting up favorites realtime subscription:',
        error,
      );
    }
  }, [realtimeEnabled, activeTab, loadDeals, loadRestaurants]);

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
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Tab change ---------------------------------------------------------

  useEffect(() => {
    if (activeTab === 'restaurants' && !restaurantsLoading) {
      loadRestaurants(hasLoadedRestaurants);
    } else if (activeTab === 'deals' && !dealsLoading) {
      loadDeals(hasLoadedDeals);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ----- Focus sync ---------------------------------------------------------

  useFocusEffect(
    React.useCallback(() => {
      setupRealtimeSubscription();

      if (hasLoadedInitialData) {
        setDeals((prev) =>
          prev.filter((deal) => !isUnfavorited(deal.id, 'deal')),
        );
        setRestaurants((prev) =>
          prev.filter(
            (restaurant) => !isUnfavorited(restaurant.id, 'restaurant'),
          ),
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
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              );
            return [...uniqueNewDeals, ...prev];
          });
        }
      }

      const silentRefresh = async () => {
        clearFavoritesCache();
        if (activeTab === 'deals') {
          await loadDeals(true);
        } else {
          await loadRestaurants(true);
        }
        clearNewlyFavorited();
      };

      if (hasLoadedInitialData) {
        silentRefresh();
      }

      return () => {
        if (favoriteChannel.current) {
          supabase.removeChannel(favoriteChannel.current);
        }
      };
    }, [activeTab, hasLoadedInitialData]),
  );

  // ----- Pull-to-refresh ----------------------------------------------------

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      clearFavoritesCache();
      if (activeTab === 'deals') {
        await loadDeals();
      } else {
        await loadRestaurants();
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
            parseFloat(
              restaurant.distance.replace('mi', '').replace('m', ''),
            ) || 0,
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
            setDeals((prev) =>
              prev.filter((d) => d.restaurantName !== restaurant.name),
            );
          }
        } else {
          setDeals((prev) => prev.filter((d) => d.id !== id));
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

        clearFavoritesCache();
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
    [unfavoritingIds, restaurants, markAsUnfavorited],
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
