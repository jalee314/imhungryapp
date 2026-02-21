/**
 * @file useDiscover — Headless hook that owns all Discover state & side-effects.
 *
 * Extracted from the original DiscoverFeed monolith so section components
 * can remain purely presentational.
 */

import { useNavigation } from '@react-navigation/native';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { useLocation } from '../../hooks/useLocation';
import {
  getRestaurantsWithDeals,
  getRestaurantsWithDealsDirect,
} from '../../services/discoverService';
import type { DiscoverRestaurant } from '../../types/discover';
import { startPerfSpan } from '../../utils/perfMonitor';

import type { DiscoverContext } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum distance limit in miles */
const MAX_DISTANCE_MILES = 31;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDiscover(): DiscoverContext {
  const navigation = useNavigation();
  const { selectedCoordinates } = useLocation();

  // ----- Core state ---------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<DiscoverRestaurant[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ----- Load restaurants ---------------------------------------------------

  const loadRestaurants = useCallback(
    async (coords?: { lat: number; lng: number } | null) => {
      const span = startPerfSpan('screen.discover.load', {
        hasCoordinates: Boolean(coords),
      });
      let spanClosed = false;
      let loadedRestaurants = 0;
      let usedDirectFallback = false;

      try {
        setLoading(true);
        setError(null);

        let result = await getRestaurantsWithDeals(coords || undefined);
        span.recordRoundTrip({
          source: 'service.discover.getRestaurantsWithDeals',
          success: result.success,
          count: result.count,
        });

        if (!result.success && result.error?.includes('function')) {
          console.log(
            'RPC function not available, trying direct query...',
          );
          usedDirectFallback = true;
          result = await getRestaurantsWithDealsDirect(coords || undefined);
          span.recordRoundTrip({
            source: 'service.discover.getRestaurantsWithDealsDirect',
            success: result.success,
            count: result.count,
          });
        }

        if (result.success) {
          loadedRestaurants = result.restaurants.length;
          span.addPayload(result.restaurants);
          setRestaurants(result.restaurants);
        } else {
          setError(result.error || 'Failed to load restaurants');
        }
      } catch (err) {
        console.error('Error loading restaurants:', err);
        setError('Failed to load restaurants');
        span.end({ success: false, error: err });
        spanClosed = true;
      } finally {
        setLoading(false);
        if (!spanClosed) {
          span.end({
            metadata: {
              restaurantsLoaded: loadedRestaurants,
              usedDirectFallback,
            },
          });
        }
      }
    },
    [],
  );

  useEffect(() => {
    loadRestaurants(selectedCoordinates);
  }, [selectedCoordinates, loadRestaurants]);

  // ----- Derived filtered list (search + distance + sort) -------------------

  const filteredRestaurants = useMemo(
    () =>
      restaurants
        .filter(
          (r) =>
            r.distance_miles <= MAX_DISTANCE_MILES &&
            r.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        .sort((a, b) => a.distance_miles - b.distance_miles),
    [restaurants, searchQuery],
  );

  // ----- Interactions -------------------------------------------------------

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleRowCardPress = useCallback(
    (id: string) => {
      const restaurant = restaurants.find((r) => r.restaurant_id === id);
      if (restaurant) {
        (navigation as any).navigate('RestaurantDetail', { restaurant });
      }
    },
    [restaurants, navigation],
  );

  const handleRetry = useCallback(() => {
    loadRestaurants(selectedCoordinates);
  }, [loadRestaurants, selectedCoordinates]);

  // ----- Return context -----------------------------------------------------
  return {
    state: {
      searchQuery,
      loading,
      restaurants,
      filteredRestaurants,
      error,
    },
    interactions: {
      handleSearchChange,
      handleClearSearch,
      handleRowCardPress,
      handleRetry,
    },
  };
}
