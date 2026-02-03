import { supabase } from '../../lib/supabase';
import { mapAndCreateRestaurantCuisine } from './cuisineMappingService';

export interface GooglePlaceResult {
  google_place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_miles: number;
  types?: string[]; // Google Places API types for cuisine mapping (optional)
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
 * Includes 15-second timeout to prevent indefinite hangs
 */
export const searchRestaurants = async (
  query: string,
  userLat: number,
  userLng: number,
  abortSignal?: AbortSignal
): Promise<RestaurantSearchResult> => {
  // Timeout duration for search operations (15 seconds)
  const SEARCH_TIMEOUT_MS = 15000;

  try {
    if (!query || query.trim().length === 0) {
      return { success: true, restaurants: [], count: 0 };
    }

    // Check if already aborted
    if (abortSignal?.aborted) {
      return { success: false, restaurants: [], count: 0, error: 'Search cancelled' };
    }

    console.log(`🔍 Searching for "${query}" (max radius: ~31 miles)...`);

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Search timed out after 15 seconds'));
      }, SEARCH_TIMEOUT_MS);

      // Clear timeout if aborted
      abortSignal?.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new Error('Search cancelled'));
      });
    });

    // Race between the actual search and the timeout
    const searchPromise = supabase.functions.invoke('search-restaurants', {
      body: {
        query: query.trim(),
        userLat,
        userLng,
        radius: 31, // 31 miles = ~50km (Google's maximum)
      },
    });

    const result = await Promise.race([searchPromise, timeoutPromise]);
    const { data, error } = result as { data: any; error: any };

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
  } catch (error: any) {
    console.error('Error searching restaurants:', error);

    // Provide more specific error messages
    let errorMessage = 'An unexpected error occurred';
    if (error?.message?.includes('timed out')) {
      errorMessage = 'Search timed out. Please try again.';
    } else if (error?.message?.includes('cancelled')) {
      errorMessage = 'Search cancelled';
    }

    return {
      success: false,
      restaurants: [],
      count: 0,
      error: errorMessage,
    };
  }
};

/**
 * Get or create restaurant in database using RPC
 * Handles brand matching automatically via database function
 * Also creates restaurant_cuisine entries based on Google Places types
 * Returns restaurant_id for deal creation
 */
export const getOrCreateRestaurant = async (
  placeData: GooglePlaceResult
): Promise<{ success: boolean; restaurant_id?: string; error?: string }> => {
  try {
    console.log('🔄 Getting/creating restaurant via RPC:', placeData.name);

    // First, check if restaurant already exists to determine if we need cuisine mapping
    const { data: existingRestaurant } = await supabase
      .from('restaurant')
      .select('restaurant_id')
      .eq('google_place_id', placeData.google_place_id)
      .single();

    const restaurantExisted = !!existingRestaurant;

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

    // If restaurant was newly created or doesn't have cuisine mapping yet, apply cuisine mapping
    if (!restaurantExisted || restaurantId) {
      try {
        // Check if restaurant already has cuisine mappings
        const { data: existingCuisineMapping } = await supabase
          .from('restaurant_cuisine')
          .select('restaurant_id')
          .eq('restaurant_id', restaurantId)
          .limit(1);

        // Only create cuisine mapping if none exists
        if (!existingCuisineMapping || existingCuisineMapping.length === 0) {
          console.log('🍽️ Applying cuisine mapping for restaurant:', placeData.name);
          const cuisineMappingSuccess = await mapAndCreateRestaurantCuisine(
            restaurantId,
            placeData.types || []
          );

          if (cuisineMappingSuccess) {
            console.log('✅ Cuisine mapping applied successfully');
          } else {
            console.warn('⚠️ Cuisine mapping failed, but restaurant creation succeeded');
          }
        } else {
          console.log('ℹ️ Restaurant already has cuisine mapping, skipping');
        }
      } catch (cuisineError) {
        console.error('Error applying cuisine mapping:', cuisineError);
        // Don't fail the whole operation if cuisine mapping fails
      }
    }

    return { success: true, restaurant_id: restaurantId };
  } catch (error) {
    console.error('Error in getOrCreateRestaurant:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};