import { supabase } from '../../lib/supabase';
import { getCurrentUserLocation } from './locationService';
import { calculateDistance } from './locationService';

export interface DiscoverRestaurant {
  restaurant_id: string;
  name: string;
  address: string;
  restaurant_image_metadata?: string; // Changed from logo_image
  deal_count: number;
  distance_miles: number;
  lat: number;
  lng: number;
}

export interface DiscoverResult {
  success: boolean;
  restaurants: DiscoverRestaurant[];
  count: number;
  error?: string;
}

/**
 * Get all unique restaurants that have deals, with deal counts and distances
 * @param customCoordinates - Optional custom coordinates to use for distance calculation instead of user's location
 */
export const getRestaurantsWithDeals = async (customCoordinates?: { lat: number; lng: number }): Promise<DiscoverResult> => {
  try {
    console.log('🔍 Fetching restaurants with deals...');

    // Get location for distance calculation
    let locationToUse: { lat: number; lng: number } | null = null;
    
    if (customCoordinates) {
      console.log('📍 Using custom coordinates:', customCoordinates);
      locationToUse = customCoordinates;
    } else {
      // Get current user location for distance calculation
      const userLocation = await getCurrentUserLocation();
      if (!userLocation) {
        return {
          success: false,
          restaurants: [],
          count: 0,
          error: 'User location not available'
        };
      }
      console.log('📍 User location:', userLocation);
      locationToUse = userLocation;
    }

    // Query to get unique restaurants with deal counts
    // This uses a CTE to get restaurant counts and then joins with restaurant data
    const { data, error } = await supabase.rpc('get_restaurants_with_deal_counts', {
      user_lat: locationToUse.lat,
      user_lng: locationToUse.lng
    });

    if (error) {
      console.error('Error fetching restaurants with deals:', error);
      return {
        success: false,
        restaurants: [],
        count: 0,
        error: 'Failed to fetch restaurants'
      };
    }

    if (!data || data.length === 0) {
      console.log('No restaurants found');
      return {
        success: true,
        restaurants: [],
        count: 0
      };
    }

    // Transform the data to match our interface
    const restaurants: DiscoverRestaurant[] = data.map((restaurant: any) => ({
      restaurant_id: restaurant.restaurant_id,
      name: restaurant.name,
      address: restaurant.address,
      restaurant_image_metadata: restaurant.restaurant_image_metadata, // Changed
      deal_count: parseInt(restaurant.deal_count) || 0,
      distance_miles: parseFloat(restaurant.distance_miles) || 0,
      lat: parseFloat(restaurant.lat),
      lng: parseFloat(restaurant.lng)
    }));

    // Sort by distance (closest first)
    restaurants.sort((a, b) => a.distance_miles - b.distance_miles);

    console.log(`✅ Found ${restaurants.length} restaurants with deals`);
    return {
      success: true,
      restaurants,
      count: restaurants.length
    };

  } catch (error) {
    console.error('Error in getRestaurantsWithDeals:', error);
    return {
      success: false,
      restaurants: [],
      count: 0,
      error: 'An unexpected error occurred'
    };
  }
};

/**
 * Alternative implementation using direct SQL query (if RPC function doesn't exist)
 * This can be used as a fallback or if you prefer to implement the logic in the client
 * @param customCoordinates - Optional custom coordinates to use for distance calculation instead of user's location
 */
export const getRestaurantsWithDealsDirect = async (customCoordinates?: { lat: number; lng: number }): Promise<DiscoverResult> => {
  try {
    console.log('🔍 Fetching restaurants with deals (direct query)...');

    // Get location for distance calculation
    let locationToUse: { lat: number; lng: number } | null = null;
    
    if (customCoordinates) {
      console.log('📍 Using custom coordinates:', customCoordinates);
      locationToUse = customCoordinates;
    } else {
      // Get current user location
      const userLocation = await getCurrentUserLocation();
      if (!userLocation) {
        return {
          success: false,
          restaurants: [],
          count: 0,
          error: 'User location not available'
        };
      }
      locationToUse = userLocation;
    }

    // First, get all unique restaurant IDs that have deals
    const { data: restaurantIds, error: idsError } = await supabase
      .from('deal_instance')
      .select(`
        deal_template!inner(
          restaurant_id
        )
      `)
      .not('deal_template.restaurant_id', 'is', null);

    if (idsError) {
      console.error('Error fetching restaurant IDs:', idsError);
      return {
        success: false,
        restaurants: [],
        count: 0,
        error: 'Failed to fetch restaurant IDs'
      };
    }

    // Extract unique restaurant IDs
    const uniqueRestaurantIds = Array.from(
      new Set(restaurantIds.map(item => item.deal_template.restaurant_id))
    );

    if (uniqueRestaurantIds.length === 0) {
      return {
        success: true,
        restaurants: [],
        count: 0
      };
    }

    // Get restaurant details with coordinates
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants_with_coords')
      .select('restaurant_id, name, address, restaurant_image_metadata, lat, lng') // Changed
      .in('restaurant_id', uniqueRestaurantIds);

    if (restaurantsError) {
      console.error('Error fetching restaurant details:', restaurantsError);
      return {
        success: false,
        restaurants: [],
        count: 0,
        error: 'Failed to fetch restaurant details'
      };
    }

    // Get deal counts for each restaurant
    const dealCounts: Record<string, number> = {};
    for (const restaurantId of uniqueRestaurantIds) {
      const { count, error: countError } = await supabase
        .from('deal_instance')
        .select('*', { count: 'exact', head: true })
        .eq('deal_template.restaurant_id', restaurantId)
        .not('deal_template.restaurant_id', 'is', null);

      if (!countError && count !== null) {
        dealCounts[restaurantId] = count;
      } else {
        dealCounts[restaurantId] = 0;
      }
    }

    // Transform and calculate distances
    const result: DiscoverRestaurant[] = restaurants
      .filter(restaurant => restaurant.lat && restaurant.lng)
      .map(restaurant => {
        const distance = calculateDistance(
          locationToUse!.lat,
          locationToUse!.lng,
          restaurant.lat,
          restaurant.lng
        );

        return {
          restaurant_id: restaurant.restaurant_id,
          name: restaurant.name,
          address: restaurant.address,
          restaurant_image_metadata: restaurant.restaurant_image_metadata, // Changed
          deal_count: dealCounts[restaurant.restaurant_id] || 0,
          distance_miles: Math.round(distance * 10) / 10, // Round to 1 decimal place
          lat: restaurant.lat,
          lng: restaurant.lng
        };
      })
      .filter(restaurant => restaurant.deal_count > 0) // Only include restaurants with deals
      .sort((a, b) => a.distance_miles - b.distance_miles); // Sort by distance

    console.log(`✅ Found ${result.length} restaurants with deals`);
    return {
      success: true,
      restaurants: result,
      count: result.length
    };

  } catch (error) {
    console.error('Error in getRestaurantsWithDealsDirect:', error);
    return {
      success: false,
      restaurants: [],
      count: 0,
      error: 'An unexpected error occurred'
    };
  }
};
