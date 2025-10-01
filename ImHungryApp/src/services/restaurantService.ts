import { supabase } from '../../lib/supabase';

export interface GooglePlaceResult {
  google_place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_miles: number;
}

export interface RestaurantSearchResult {
  success: boolean;
  restaurants: GooglePlaceResult[];
  count: number;
  error?: string;
}

/**
 * Search restaurants using Google Places API via Edge Function
 * Uses maximum allowed radius (~31 miles / 50km)
 */
export const searchRestaurants = async (
  query: string,
  userLat: number,
  userLng: number
): Promise<RestaurantSearchResult> => {
  try {
    if (!query || query.trim().length === 0) {
      return { success: true, restaurants: [], count: 0 };
    }

    console.log(`🔍 Searching for "${query}" (max radius: ~31 miles)...`);

    const { data, error } = await supabase.functions.invoke('search-restaurants', {
      body: {
        query: query.trim(),
        userLat,
        userLng,
        radius: 31, // 31 miles = ~50km (Google's maximum)
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      return {
        success: false,
        restaurants: [],
        count: 0,
        error: 'Failed to search restaurants',
      };
    }

    console.log(`✅ Found ${data.count} restaurants`);
    return data;
  } catch (error) {
    console.error('Error searching restaurants:', error);
    return {
      success: false,
      restaurants: [],
      count: 0,
      error: 'An unexpected error occurred',
    };
  }
};

/**
 * Get or create restaurant in database using RPC
 * Handles brand matching automatically via database function
 * Returns restaurant_id for deal creation
 */
export const getOrCreateRestaurant = async (
  placeData: GooglePlaceResult
): Promise<{ success: boolean; restaurant_id?: string; error?: string }> => {
  try {
    console.log('🔄 Getting/creating restaurant via RPC:', placeData.name);

    // Call the RPC function that handles duplicate checking and brand matching
    const { data: restaurantId, error: rpcError } = await supabase
      .rpc('get_or_create_restaurant', {
        p_google_place_id: placeData.google_place_id,
        p_name: placeData.name,
        p_address: placeData.address,
        p_lat: placeData.lat,
        p_lng: placeData.lng,
      });

    if (rpcError) {
      console.error('RPC error:', rpcError);
      return { success: false, error: 'Failed to create/fetch restaurant' };
    }

    console.log('✅ Restaurant ID:', restaurantId);
    return { success: true, restaurant_id: restaurantId };
  } catch (error) {
    console.error('Error in getOrCreateRestaurant:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};