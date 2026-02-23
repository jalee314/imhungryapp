import type React from 'react';
import { useCallback } from 'react';

import {
  fetchFavoriteDeals,
  fetchFavoriteRestaurants,
} from '../../services/favoritesService';
import type { FavoriteDeal, FavoriteRestaurant } from '../../types/favorites';
import { startPerfSpan } from '../../utils/perfMonitor';

import type { FavoritesTab } from './types';

interface UseFavoritesDataLoadersParams {
  hasLoadedDeals: boolean;
  hasLoadedInitialData: boolean;
  hasLoadedRestaurants: boolean;
  setDeals: React.Dispatch<React.SetStateAction<FavoriteDeal[]>>;
  setDealsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setHasLoadedDeals: React.Dispatch<React.SetStateAction<boolean>>;
  setHasLoadedInitialData: React.Dispatch<React.SetStateAction<boolean>>;
  setHasLoadedRestaurants: React.Dispatch<React.SetStateAction<boolean>>;
  setRestaurants: React.Dispatch<React.SetStateAction<FavoriteRestaurant[]>>;
  setRestaurantsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  clearUnfavorited: () => void;
  isUnfavorited: (id: string, type: 'deal' | 'restaurant') => boolean;
  needsDealsRefreshRef: React.MutableRefObject<boolean>;
  needsRestaurantsRefreshRef: React.MutableRefObject<boolean>;
  refreshDebounceTimeout: React.MutableRefObject<NodeJS.Timeout | null>;
}

const useFavoritesFetchLifecycle = ({
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
}: Omit<
  UseFavoritesDataLoadersParams,
  'needsDealsRefreshRef' | 'needsRestaurantsRefreshRef' | 'refreshDebounceTimeout'
>) => {
  const ensureInitialDataLoaded = useCallback(() => {
    if (!hasLoadedInitialData) {
      clearUnfavorited();
      setHasLoadedInitialData(true);
    }
  }, [clearUnfavorited, hasLoadedInitialData, setHasLoadedInitialData]);

  const loadRestaurants = useCallback(
    async (silent = false, forceRefresh = false) => {
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

        ensureInitialDataLoaded();

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
    [
      ensureInitialDataLoaded,
      hasLoadedRestaurants,
      isUnfavorited,
      setHasLoadedRestaurants,
      setRestaurants,
      setRestaurantsLoading,
    ],
  );

  const loadDeals = useCallback(
    async (silent = false, forceRefresh = false) => {
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

        ensureInitialDataLoaded();

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
    [
      ensureInitialDataLoaded,
      hasLoadedDeals,
      isUnfavorited,
      setDeals,
      setDealsLoading,
      setHasLoadedDeals,
    ],
  );

  return {
    loadDeals,
    loadRestaurants,
  };
};

export const useFavoritesDataLoaders = ({
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
}: UseFavoritesDataLoadersParams) => {
  const { loadDeals, loadRestaurants } = useFavoritesFetchLifecycle({
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
  });

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
    [
      hasLoadedDeals,
      hasLoadedRestaurants,
      loadDeals,
      loadRestaurants,
      needsDealsRefreshRef,
      needsRestaurantsRefreshRef,
      refreshDebounceTimeout,
    ],
  );

  return {
    loadDeals,
    loadRestaurants,
    scheduleSilentRevalidate,
  };
};
