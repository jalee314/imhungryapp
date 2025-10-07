import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../../lib/supabase'; // Adjust this import path as needed
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

export interface Category {
  id: string; // Corresponds to category_id
  name: string; // Corresponds to category_name
}

export interface Cuisine {
  id: string; // Corresponds to cuisine_id
  name: string; // Corresponds to cuisine_name
}

export interface Restaurant {
  id: string; // Corresponds to restaurant_id
  name: string;
  address: string;
  lat: number; // Extracted from PostGIS location
  lng: number; // Extracted from PostGIS location
  imageMetadataId?: string; // Changed from logoImage
  brandId?: string; // Corresponds to brand_id
}

interface DataState {
  categories: Category[];
  cuisines: Cuisine[];
  restaurants: Restaurant[];
  loading: boolean;
  error: Error | null;
}

const DataCacheContext = createContext<DataState | undefined>(undefined);

export const DataCacheProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [state, setState] = useState<DataState>({
    categories: [],
    cuisines: [],
    restaurants: [],
    loading: true,
    error: null,
  });
  
  const appStateSubscription = useRef<ReturnType<typeof AppState.addEventListener> | null>(null);

  useEffect(() => {
    const loadFromCache = async () => {
      try {
        const [categoriesJson, cuisinesJson, restaurantsJson] = await Promise.all([
          AsyncStorage.getItem('cached_categories'),
          AsyncStorage.getItem('cached_cuisines'),
          AsyncStorage.getItem('cached_restaurants')
        ]);
        
        if (categoriesJson && cuisinesJson) {
          const categories = JSON.parse(categoriesJson) as Category[];
          const cuisines = JSON.parse(cuisinesJson) as Cuisine[];
          const restaurants = restaurantsJson ? JSON.parse(restaurantsJson) as Restaurant[] : [];
          
          setState(prev => ({
            ...prev,
            categories,
            cuisines,
            restaurants,
            loading: false
          }));
          console.log('Loaded data from cache:', { 
            categories: categories.length, 
            cuisines: cuisines.length,
            restaurants: restaurants.length
          });
          return true; // Successfully loaded from cache
        }
        return false; // Cache was empty or incomplete
      } catch (error) {
        console.error('Error loading data from cache:', error);
        return false;
      }
    };

    const fetchAndCacheData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        // Fetch all data in parallel
        const [
          { data: categoriesData, error: categoriesError },
          { data: cuisinesData, error: cuisinesError },
          { data: restaurantsData, error: restaurantsError }
        ] = await Promise.all([
          // Fetch categories
          supabase.from('category').select('category_id, category_name'),
          
          // Fetch cuisines
          supabase.from('cuisine').select('cuisine_id, cuisine_name'),
          
          // Fetch restaurants using your existing view
          supabase
            .from('restaurants_with_coords')
            .select('restaurant_id, name, address, restaurant_image_metadata, brand_id, lat, lng')
            .limit(100)
        ]);
          
        if (categoriesError) throw categoriesError;
        if (cuisinesError) throw cuisinesError;
        if (restaurantsError) throw restaurantsError;
        
        // Transform data to match our interfaces
        const categories = categoriesData.map(item => ({
          id: item.category_id,
          name: item.category_name
        }));
        
        const cuisines = cuisinesData.map(item => ({
          id: item.cuisine_id,
          name: item.cuisine_name
        }));
        
        // Transform restaurants - lat/lng are already extracted by the view
        const restaurants = restaurantsData
          .filter(item => item.lat !== null && item.lng !== null && !isNaN(item.lat) && !isNaN(item.lng))
          .map(item => ({
            id: item.restaurant_id,
            name: item.name,
            address: item.address,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lng),
            imageMetadataId: item.restaurant_image_metadata, // Changed
            brandId: item.brand_id
          }));
        
        // Update state with new data
        setState({
          categories,
          cuisines,
          restaurants,
          loading: false,
          error: null
        });
        
        // Cache the data in AsyncStorage
        await Promise.all([
          AsyncStorage.setItem('cached_categories', JSON.stringify(categories)),
          AsyncStorage.setItem('cached_cuisines', JSON.stringify(cuisines)),
          AsyncStorage.setItem('cached_restaurants', JSON.stringify(restaurants))
        ]);
        
        console.log('Fetched and cached fresh data:', { 
          categories: categories.length, 
          cuisines: cuisines.length,
          restaurants: restaurants.length
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('An unknown error occurred')
        }));
      }
    };

    // Initial setup: load from cache, then fetch fresh data
    const initialize = async () => {
      // Try loading from cache first
      const cacheLoaded = await loadFromCache();
      
      // Check if we need to fetch fresh data
      const lastFetchTime = await AsyncStorage.getItem('last_data_fetch_time');
      const shouldFetchFreshData = !lastFetchTime || 
        (Date.now() - parseInt(lastFetchTime)) > 3600000; // 1 hour in milliseconds
      
      if (shouldFetchFreshData || !cacheLoaded) {
        await fetchAndCacheData();
        // Store fetch timestamp
        await AsyncStorage.setItem('last_data_fetch_time', Date.now().toString());
      }
    };

    initialize();
    
    // Set up Supabase real-time subscriptions
    const categoriesChannel = supabase.channel('categories-changes')
      .on('postgres_changes', {
        event: '*', // Listen for all events (insert, update, delete)
        schema: 'public',
        table: 'category'
      }, () => {
        console.log('Categories table changed, refreshing data...');
        fetchAndCacheData();
      })
      .subscribe();
      
    const cuisinesChannel = supabase.channel('cuisines-changes')
      .on('postgres_changes', {
        event: '*', // Listen for all events (insert, update, delete)
        schema: 'public',
        table: 'cuisine'
      }, () => {
        console.log('Cuisines table changed, refreshing data...');
        fetchAndCacheData();
      })
      .subscribe();
      
    // Add restaurant channel subscription - FIXED: Listen to the actual 'restaurant' table
    const restaurantsChannel = supabase.channel('restaurants-changes')
      .on('postgres_changes', {
        event: '*', // Listen for all events (insert, update, delete)
        schema: 'public',
        table: 'restaurant' // This should match your actual table name
      }, () => {
        console.log('Restaurants table changed, refreshing data...');
        fetchAndCacheData();
      })
      .subscribe();

    // Set up AppState listener to refresh data when app comes to foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('App has come to the foreground, refreshing data...');
        fetchAndCacheData();
      }
    };

    appStateSubscription.current = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup function
    return () => {
      // Unsubscribe from Supabase channels
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(cuisinesChannel);
      supabase.removeChannel(restaurantsChannel);
      
      // Remove AppState listener
      if (appStateSubscription.current) {
        appStateSubscription.current.remove();
      }
    };
  }, []);

  return (
    <DataCacheContext.Provider value={state}>
      {children}
    </DataCacheContext.Provider>
  );
};

export const useDataCache = () => {
  const context = useContext(DataCacheContext);
  if (context === undefined) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
};