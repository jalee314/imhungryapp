import { create } from 'zustand';
import React from 'react';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import type { Category, Cuisine, Restaurant } from '../types';

interface DataCacheState {
  // Reactive state
  categories: Category[];
  cuisines: Cuisine[];
  restaurants: Restaurant[];
  loading: boolean;
  error: Error | null;

  // Internals
  _initialized: boolean;
  _isRefreshing: boolean; // Mutex to prevent overlapping refreshes
  _appStateSubscription: ReturnType<typeof AppState.addEventListener> | null;

  // Actions
  initialize: () => Promise<void>;
  cleanup: () => void;
  fetchAndCacheData: () => Promise<void>;
  loadFromCache: () => Promise<boolean>;
  refreshIfStale: (thresholdMs: number) => Promise<void>;
}

const LAST_FETCH_KEY = 'last_data_fetch_time';
const CATEGORIES_KEY = 'cached_categories';
const CUISINES_KEY = 'cached_cuisines';
const RESTAURANTS_KEY = 'cached_restaurants';

// Timeout duration for operations (10 seconds)
const OPERATION_TIMEOUT_MS = 10000;
// Timeout for AsyncStorage operations (5 seconds)
const CACHE_TIMEOUT_MS = 5000;

/**
 * Wraps a promise with a timeout. Rejects if timeout is exceeded.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export const useDataCacheStore = create<DataCacheState>((set, get) => ({
  categories: [],
  cuisines: [],
  restaurants: [],
  loading: true,
  error: null,
  _initialized: false,
  _isRefreshing: false,
  _appStateSubscription: null,

  initialize: async () => {
    // Prevent multiple simultaneous initializations
    if (get()._initialized) {
      console.log('DataCacheStore: Already initialized, skipping');
      return;
    }

    console.log('DataCacheStore: Starting initialization');

    try {
      // 1) Warm from cache first (with timeout)
      let cacheLoaded = false;
      try {
        cacheLoaded = await withTimeout(
          get().loadFromCache(),
          CACHE_TIMEOUT_MS,
          'loadFromCache'
        );
      } catch (cacheError) {
        console.warn('DataCacheStore: Cache load failed or timed out:', cacheError);
        // Continue without cache - will fetch fresh data
      }

      // 2) Decide if we should fetch fresh (1h TTL on init)
      let shouldFetchFresh = true;
      try {
        const lastFetchTime = await withTimeout(
          AsyncStorage.getItem(LAST_FETCH_KEY),
          CACHE_TIMEOUT_MS,
          'getLastFetchTime'
        );
        shouldFetchFresh = !lastFetchTime || (Date.now() - parseInt(lastFetchTime)) > 3600000; // 1 hour
      } catch (err) {
        console.warn('DataCacheStore: Could not read last fetch time:', err);
        // Default to fetching fresh data
      }

      if (shouldFetchFresh || !cacheLoaded) {
        try {
          await withTimeout(
            get().fetchAndCacheData(),
            OPERATION_TIMEOUT_MS,
            'fetchAndCacheData'
          );
          // Update last fetch time (don't block on this)
          AsyncStorage.setItem(LAST_FETCH_KEY, Date.now().toString()).catch(() => { });
        } catch (fetchError) {
          console.error('DataCacheStore: Fetch failed or timed out:', fetchError);
          // If we had cached data, keep using it. Otherwise set error.
          if (!cacheLoaded) {
            set({ error: fetchError as Error });
          }
        }
      }

      // 3) Always ensure loading is false after initialization attempt
      set({ loading: false });

      // 4) AppState foreground refresh (5 min TTL) - with error handling
      const handleAppStateChange = async (next: AppStateStatus) => {
        if (next === 'active') {
          try {
            await get().refreshIfStale(300000); // 5 minutes
          } catch (refreshError) {
            console.warn('DataCacheStore: Background refresh failed:', refreshError);
            // Don't crash - just log and continue
          }
        }
      };

      const sub = AppState.addEventListener('change', handleAppStateChange);
      set({ _appStateSubscription: sub, _initialized: true });

      console.log('DataCacheStore: Initialization complete');
    } catch (unexpectedError) {
      // Catch-all for any unexpected errors during initialization
      console.error('DataCacheStore: Unexpected initialization error:', unexpectedError);
      set({ loading: false, error: unexpectedError as Error, _initialized: true });
    }
  },

  cleanup: () => {
    const sub = get()._appStateSubscription;
    sub?.remove?.();
    set({ _appStateSubscription: null, _initialized: false, _isRefreshing: false });
  },

  loadFromCache: async () => {
    try {
      const [categoriesJson, cuisinesJson, restaurantsJson] = await Promise.all([
        AsyncStorage.getItem(CATEGORIES_KEY),
        AsyncStorage.getItem(CUISINES_KEY),
        AsyncStorage.getItem(RESTAURANTS_KEY),
      ]);

      if (categoriesJson && cuisinesJson) {
        const categories = JSON.parse(categoriesJson) as Category[];
        const cuisines = JSON.parse(cuisinesJson) as Cuisine[];
        const restaurants = restaurantsJson ? (JSON.parse(restaurantsJson) as Restaurant[]) : [];
        set({ categories, cuisines, restaurants, loading: false });
        console.log('DataCacheStore: Loaded from cache', {
          categories: categories.length,
          cuisines: cuisines.length,
          restaurants: restaurants.length
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error('DataCacheStore: Error loading cache:', e);
      return false;
    }
  },

  fetchAndCacheData: async () => {
    set({ loading: true, error: null });

    try {
      const [cats, cuis, rests] = await Promise.all([
        supabase.from('category').select('category_id, category_name'),
        supabase.from('cuisine').select('cuisine_id, cuisine_name'),
        supabase
          .from('restaurants_with_coords')
          .select('restaurant_id, name, address, restaurant_image_metadata, brand_id, lat, lng')
          .limit(100),
      ]);

      if (cats.error) throw cats.error;
      if (cuis.error) throw cuis.error;
      if (rests.error) throw rests.error;

      const categories: Category[] = (cats.data || []).map((item: any) => ({
        id: item.category_id,
        name: item.category_name,
      }));

      const cuisines: Cuisine[] = (cuis.data || []).map((item: any) => ({
        id: item.cuisine_id,
        name: item.cuisine_name,
      }));

      const restaurants: Restaurant[] = (rests.data || [])
        .filter((item: any) => item.lat !== null && item.lng !== null && !isNaN(item.lat) && !isNaN(item.lng))
        .map((item: any) => ({
          id: item.restaurant_id,
          name: item.name,
          address: item.address,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lng),
          imageMetadataId: item.restaurant_image_metadata,
          brandId: item.brand_id,
        }));

      set({ categories, cuisines, restaurants, loading: false, error: null });

      // Cache in background - don't block on this
      Promise.all([
        AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories)),
        AsyncStorage.setItem(CUISINES_KEY, JSON.stringify(cuisines)),
        AsyncStorage.setItem(RESTAURANTS_KEY, JSON.stringify(restaurants)),
        AsyncStorage.setItem(LAST_FETCH_KEY, Date.now().toString()),
      ]).catch((cacheError) => {
        console.warn('DataCacheStore: Failed to cache data:', cacheError);
      });

      console.log('DataCacheStore: Fetched fresh data', {
        categories: categories.length,
        cuisines: cuisines.length,
        restaurants: restaurants.length
      });
    } catch (error) {
      console.error('DataCacheStore: Error fetching data:', error);
      // Always set loading to false, even on error
      set({ loading: false, error: error as Error });
      throw error; // Re-throw so caller knows it failed
    }
  },

  refreshIfStale: async (thresholdMs: number) => {
    // Prevent overlapping refresh operations
    if (get()._isRefreshing) {
      console.log('DataCacheStore: Refresh already in progress, skipping');
      return;
    }

    try {
      set({ _isRefreshing: true });

      const lastFetchTime = await withTimeout(
        AsyncStorage.getItem(LAST_FETCH_KEY),
        CACHE_TIMEOUT_MS,
        'getLastFetchTime'
      );

      const elapsed = lastFetchTime ? Date.now() - parseInt(lastFetchTime) : Infinity;

      if (elapsed > thresholdMs) {
        console.log('DataCacheStore: Data is stale, refreshing...');
        await withTimeout(
          get().fetchAndCacheData(),
          OPERATION_TIMEOUT_MS,
          'refreshFetch'
        );
      }
    } catch (error) {
      console.warn('DataCacheStore: Refresh failed:', error);
      // Don't crash the app, just log the error
    } finally {
      set({ _isRefreshing: false });
    }
  },
}));

export const useInitializeDataCache = () => {
  const initialize = useDataCacheStore((s) => s.initialize);
  const cleanup = useDataCacheStore((s) => s.cleanup);

  React.useEffect(() => {
    initialize();
    return cleanup;
  }, [initialize, cleanup]);
};
