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
 */
export const searchRestaurants = async (
  query: string,
  userLat: number,
  userLng: number,
  radius: number = 10
): Promise<RestaurantSearchResult> => {
  try {
    if (!query || query.trim().length === 0) {
      return { success: true, restaurants: [], count: 0 };
    }

    console.log(`🔍 Searching for "${query}" within ${radius} miles...`);

    const { data, error } = await supabase.functions.invoke('search-restaurants', {
      body: {
        query: query.trim(),
        userLat,
        userLng,
        radius,
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
 * Get or create restaurant in database
 * Returns restaurant_id for deal creation
 */
export const getOrCreateRestaurant = async (
  placeData: GooglePlaceResult
): Promise<{ success: boolean; restaurant_id?: string; error?: string }> => {
  try {
    // First, check if restaurant already exists by google_place_id
    const { data: existing, error: searchError } = await supabase
      .from('restaurant')
      .select('restaurant_id')
      .eq('google_place_id', placeData.google_place_id)
      .maybeSingle();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('Error checking existing restaurant:', searchError);
      return { success: false, error: 'Database error' };
    }

    if (existing) {
      console.log('✅ Restaurant already exists:', existing.restaurant_id);
      return { success: true, restaurant_id: existing.restaurant_id };
    }

    // Restaurant doesn't exist, create it
    console.log('🆕 Creating new restaurant:', placeData.name);

    const { data: newRestaurant, error: insertError } = await supabase
      .from('restaurant')
      .insert({
        name: placeData.name,
        address: placeData.address,
        location: `POINT(${placeData.lng} ${placeData.lat})`,
        google_place_id: placeData.google_place_id,
        source: 'google_places',
      })
      .select('restaurant_id')
      .single();

    if (insertError) {
      console.error('Error creating restaurant:', insertError);
      return { success: false, error: 'Failed to create restaurant' };
    }

    console.log('✅ Restaurant created:', newRestaurant.restaurant_id);
    return { success: true, restaurant_id: newRestaurant.restaurant_id };
  } catch (error) {
    console.error('Error in getOrCreateRestaurant:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};