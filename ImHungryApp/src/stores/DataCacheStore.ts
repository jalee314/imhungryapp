import { create } from 'zustand';
import React from 'react';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

export interface Category {
  id: string;
  name: string;
}

export interface Cuisine {
  id: string;
  name: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  imageMetadataId?: string;
  brandId?: string;
}

interface DataCacheState {
  // Reactive state
  categories: Category[];
  cuisines: Cuisine[];
  restaurants: Restaurant[];
  loading: boolean;
  error: Error | null;

  // Internals
  _initialized: boolean;
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

export const useDataCacheStore = create<DataCacheState>((set, get) => ({
  categories: [],
  cuisines: [],
  restaurants: [],
  loading: true,
  error: null,
  _initialized: false,
  _appStateSubscription: null,

  initialize: async () => {
    if (get()._initialized) return;

    // 1) Warm from cache first
    const cacheLoaded = await get().loadFromCache();

    // 2) Decide if we should fetch fresh (1h TTL on init)
    const lastFetchTime = await AsyncStorage.getItem(LAST_FETCH_KEY);
    const shouldFetchFresh = !lastFetchTime || (Date.now() - parseInt(lastFetchTime)) > 3600000; // 1 hour
    if (shouldFetchFresh || !cacheLoaded) {
      await get().fetchAndCacheData();
      await AsyncStorage.setItem(LAST_FETCH_KEY, Date.now().toString());
    } else {
      // Ensure loading false if we had cache
      set({ loading: false });
    }

    // 3) AppState foreground refresh (5 min TTL)
    const handleAppStateChange = async (next: AppStateStatus) => {
      if (next === 'active') {
        await get().refreshIfStale(300000); // 5 minutes
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    set({ _appStateSubscription: sub, _initialized: true });
  },

  cleanup: () => {
    const sub = get()._appStateSubscription;
    sub?.remove?.();
    set({ _appStateSubscription: null, _initialized: false });
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
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error loading cache:', e);
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

      await Promise.all([
        AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories)),
        AsyncStorage.setItem(CUISINES_KEY, JSON.stringify(cuisines)),
        AsyncStorage.setItem(RESTAURANTS_KEY, JSON.stringify(restaurants)),
        AsyncStorage.setItem(LAST_FETCH_KEY, Date.now().toString()),
      ]);
    } catch (error) {
      console.error('Error fetching data cache:', error);
      set({ loading: false, error: error as Error });
    }
  },

  refreshIfStale: async (thresholdMs: number) => {
    const lastFetchTime = await AsyncStorage.getItem(LAST_FETCH_KEY);
    const elapsed = lastFetchTime ? Date.now() - parseInt(lastFetchTime) : Infinity;
    if (elapsed > thresholdMs) {
      await get().fetchAndCacheData();
      await AsyncStorage.setItem(LAST_FETCH_KEY, Date.now().toString());
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
